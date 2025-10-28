mod models;
mod commands;
mod utils;

use commands::{settings, projects, feedback, issues, launcher, prompts, npm};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![])))
        .invoke_handler(tauri::generate_handler![
            // Settings commands
            settings::get_settings,
            settings::update_settings,
            settings::select_directory,
            settings::select_image_file,
            settings::enable_autostart,
            settings::disable_autostart,
            settings::is_autostart_enabled,
            // Project commands
            projects::scan_projects,
            projects::get_project_detail,
            projects::create_new_project,
            projects::save_project_idea,
            projects::get_project_idea,
            projects::update_project_metadata,
            projects::update_all_metadata,
            projects::create_metadata_template,
            projects::check_metadata_exists,
            projects::generate_metadata_prompt,
            projects::check_spec_files_exist,
            projects::update_project_status,
            projects::assign_color_if_missing,
            projects::create_design_feedback_file,
            projects::get_github_url,
            projects::get_project_docs,
            projects::get_cleanup_stats,
            projects::get_project_stats,
            projects::upload_project_icon,
            projects::get_icon_data_url,
            // Feedback commands
            feedback::get_feedback,
            feedback::add_feedback,
            feedback::update_feedback,
            feedback::delete_feedback,
            feedback::get_archived_feedback,
            feedback::move_feedback_to_archive,
            // Issue commands
            issues::get_issues,
            issues::add_issue,
            issues::update_issue,
            issues::delete_issue,
            issues::migrate_completed_feedback_to_issues,
            // Launcher commands
            launcher::launch_claude_code,
            launcher::open_in_explorer,
            launcher::open_url,
            launcher::open_in_vscode,
            launcher::open_in_terminal,
            launcher::open_in_fork,
            launcher::get_debug_log_path,
            launcher::log_debug,
            launcher::get_session_status,
            launcher::focus_claude_terminal,
            // Prompts commands
            prompts::get_prompt,
            // NPM commands
            npm::detect_npm_scripts,
            npm::run_npm_script,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
