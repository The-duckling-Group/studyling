-- ============================================================================
-- Studyling Learning Platform - Neon Tech Views, Stored Functions & Triggers
-- File: 03_views_and_functions.sql
-- Description: Analytical views, game loop stored procedures, and state logic
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. View: User Dashboard Summary
-- Returns consolidated stats: Streak, XP, Level, Active Courses, Due Cards
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_dashboard_summary AS
SELECT 
    u.id AS user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.streak_count,
    u.total_xp,
    u.level,
    u.study_time_today_minutes,
    u.last_active_at,
    COUNT(DISTINCT uce.course_id) FILTER (WHERE uce.status = 'active') AS active_courses_count,
    COALESCE(SUM(uce.cards_due_count) FILTER (WHERE uce.status = 'active'), 0) AS total_cards_due,
    ROUND(COALESCE(AVG(uce.progress_pct) FILTER (WHERE uce.status = 'active'), 0), 1) AS avg_course_progress
FROM users u
LEFT JOIN user_course_enrollments uce ON u.id = uce.user_id
GROUP BY u.id;

-- ----------------------------------------------------------------------------
-- 2. View: Course Catalog & User Enrollments
-- Matches Stitch Screen 2 & Screen 4
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_course_overview AS
SELECT 
    c.id AS course_id,
    c.code,
    c.code_number,
    c.title,
    c.subtitle,
    c.category,
    c.semester,
    c.topics_summary,
    c.current_level_label,
    c.current_module_label,
    c.color_accent,
    uce.user_id,
    COALESCE(uce.status, 'catalog') AS enrollment_status,
    COALESCE(uce.progress_pct, 0) AS progress_pct,
    COALESCE(uce.cards_due_count, 0) AS cards_due_count,
    uce.last_studied_at
FROM courses c
LEFT JOIN user_course_enrollments uce ON c.id = uce.course_id
ORDER BY c.code_number ASC;

-- ----------------------------------------------------------------------------
-- 3. Stored Procedure / Function: Complete Quiz Question
-- Handles answer validation, XP calculation, user streak updates, and feedback
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_complete_quiz_question(
    p_user_id UUID,
    p_question_id UUID,
    p_option_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_correct BOOLEAN := FALSE;
    v_xp_reward INT := 0;
    v_explanation TEXT := '';
    v_total_xp INT := 0;
    v_streak_count INT := 0;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Check if option is correct and get question XP
    SELECT qo.is_correct, qq.xp_reward, qq.explanation
    INTO v_is_correct, v_xp_reward, v_explanation
    FROM quiz_options qo
    JOIN quiz_questions qq ON qq.id = qo.question_id
    WHERE qo.id = p_option_id AND qq.id = p_question_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Question or Option ID not found';
    END IF;

    -- Award XP only if correct
    IF NOT v_is_correct THEN
        v_xp_reward := 0;
    END IF;

    -- Insert attempt log
    INSERT INTO user_quiz_attempts (user_id, question_id, selected_option_id, is_correct, xp_earned)
    VALUES (p_user_id, p_question_id, p_option_id, v_is_correct, v_xp_reward);

    -- Update User XP and last active timestamp
    UPDATE users
    SET total_xp = total_xp + v_xp_reward,
        last_active_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING total_xp, streak_count INTO v_total_xp, v_streak_count;

    -- Update or Insert Daily Streak
    INSERT INTO user_streaks (user_id, activity_date, sessions_completed, xp_gained, minutes_studied)
    VALUES (p_user_id, v_today, 1, v_xp_reward, 5)
    ON CONFLICT (user_id, activity_date) DO UPDATE
    SET sessions_completed = user_streaks.sessions_completed + 1,
        xp_gained = user_streaks.xp_gained + EXCLUDED.xp_gained;

    RETURN jsonb_build_object(
        'is_correct', v_is_correct,
        'xp_earned', v_xp_reward,
        'total_xp', v_total_xp,
        'streak_count', v_streak_count,
        'explanation', v_explanation
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Stored Procedure / Function: Log Study Timer Session
-- Matches Stitch Screen 5 (Pomodoro, Deep Work, 5-min Pause)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_log_study_session(
    p_user_id UUID,
    p_course_id UUID,
    p_mode VARCHAR(30),
    p_duration_seconds INT,
    p_completed BOOLEAN,
    p_dnd_active BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_xp_earned INT := 0;
    v_minutes INT := 0;
    v_total_xp INT := 0;
    v_streak_count INT := 0;
    v_today DATE := CURRENT_DATE;
BEGIN
    v_minutes := ROUND(p_duration_seconds / 60.0);
    
    -- Award XP if session was completed successfully
    IF p_completed THEN
        IF p_mode = 'deep_50' THEN
            v_xp_earned := 50;
        ELSIF p_mode = 'pomodoro_25' THEN
            v_xp_earned := 25;
        ELSE
            v_xp_earned := 10;
        END IF;
    ELSE
        -- Partial effort XP
        v_xp_earned := GREATEST(5, ROUND(v_minutes * 0.5));
    END IF;

    -- Insert into study_timer_sessions
    INSERT INTO study_timer_sessions (
        user_id, course_id, mode, duration_seconds, elapsed_seconds,
        completed, dnd_active, xp_reward, completed_at
    ) VALUES (
        p_user_id, p_course_id, p_mode, p_duration_seconds, p_duration_seconds,
        p_completed, p_dnd_active, v_xp_earned, CURRENT_TIMESTAMP
    );

    -- Update User profile
    UPDATE users
    SET total_xp = total_xp + v_xp_earned,
        study_time_today_minutes = study_time_today_minutes + v_minutes,
        last_active_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING total_xp, streak_count INTO v_total_xp, v_streak_count;

    -- Update Daily Streak entry
    INSERT INTO user_streaks (user_id, activity_date, sessions_completed, xp_gained, minutes_studied)
    VALUES (p_user_id, v_today, 1, v_xp_earned, v_minutes)
    ON CONFLICT (user_id, activity_date) DO UPDATE
    SET sessions_completed = user_streaks.sessions_completed + 1,
        xp_gained = user_streaks.xp_gained + EXCLUDED.xp_gained,
        minutes_studied = user_streaks.minutes_studied + EXCLUDED.minutes_studied;

    RETURN jsonb_build_object(
        'success', TRUE,
        'mode', p_mode,
        'minutes_logged', v_minutes,
        'xp_earned', v_xp_earned,
        'total_xp', v_total_xp,
        'streak_count', v_streak_count
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Stored Procedure / Function: Advance Learning Path Node
-- Advances user to next node and updates course progress percentage
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_advance_learning_path_node(
    p_user_id UUID,
    p_node_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_section_id UUID;
    v_course_id UUID;
    v_current_order INT;
    v_next_node_id UUID;
    v_total_nodes INT;
    v_completed_nodes INT;
    v_new_progress INT;
BEGIN
    -- Get current node details
    SELECT lpn.section_id, lpn.order_index, lps.course_id
    INTO v_section_id, v_current_order, v_course_id
    FROM learning_path_nodes lpn
    JOIN learning_path_sections lps ON lps.id = lpn.section_id
    WHERE lpn.id = p_node_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Node not found';
    END IF;

    -- Mark current node as completed
    INSERT INTO user_node_progress (user_id, node_id, status, score_pct, completed_at)
    VALUES (p_user_id, p_node_id, 'completed', 100, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, node_id) DO UPDATE
    SET status = 'completed', score_pct = 100, completed_at = CURRENT_TIMESTAMP;

    -- Find next node in sequence
    SELECT id INTO v_next_node_id
    FROM learning_path_nodes
    WHERE section_id = v_section_id AND order_index = v_current_order + 1;

    -- If next node exists, unlock it
    IF v_next_node_id IS NOT NULL THEN
        INSERT INTO user_node_progress (user_id, node_id, status, score_pct)
        VALUES (p_user_id, v_next_node_id, 'current', 0)
        ON CONFLICT (user_id, node_id) DO UPDATE
        SET status = CASE WHEN user_node_progress.status = 'completed' THEN 'completed' ELSE 'current' END;
    END IF;

    -- Recalculate progress percentage for this course
    SELECT COUNT(*) INTO v_total_nodes
    FROM learning_path_nodes lpn
    JOIN learning_path_sections lps ON lps.id = lpn.section_id
    WHERE lps.course_id = v_course_id;

    SELECT COUNT(*) INTO v_completed_nodes
    FROM user_node_progress unp
    JOIN learning_path_nodes lpn ON lpn.id = unp.node_id
    JOIN learning_path_sections lps ON lps.id = lpn.section_id
    WHERE unp.user_id = p_user_id AND lps.course_id = v_course_id AND unp.status = 'completed';

    IF v_total_nodes > 0 THEN
        v_new_progress := ROUND((v_completed_nodes::numeric / v_total_nodes::numeric) * 100);
    ELSE
        v_new_progress := 0;
    END IF;

    -- Update course enrollment progress
    UPDATE user_course_enrollments
    SET progress_pct = v_new_progress,
        last_studied_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND course_id = v_course_id;

    RETURN jsonb_build_object(
        'completed_node_id', p_node_id,
        'unlocked_next_node_id', v_next_node_id,
        'new_progress_pct', v_new_progress
    );
END;
$$;
