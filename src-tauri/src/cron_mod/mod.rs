// NixDeck 2133 - Cron Management Module
use std::process::Command;

pub async fn list_jobs() -> Result<Vec<String>, String> {
    let output = Command::new("crontab")
        .arg("-l")
        .output()
        .map_err(|e| format!("Failed to list cron jobs: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("no crontab") {
            return Ok(Vec::new());
        }
        return Err(stderr.to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let jobs: Vec<String> = stdout
        .lines()
        .filter(|line| !line.trim().is_empty() && !line.starts_with('#'))
        .map(|line| line.to_string())
        .collect();

    Ok(jobs)
}

pub async fn create_job(schedule: String, command: String) -> Result<(), String> {
    // Get existing crontab
    let mut existing_jobs = list_jobs().await?;
    
    // Add new job
    let new_job = format!("{} {}", schedule, command);
    existing_jobs.push(new_job);
    
    // Write back to crontab
    let crontab_content = existing_jobs.join("\n") + "\n";
    
    let mut child = Command::new("crontab")
        .arg("-")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn crontab: {}", e))?;

    use std::io::Write;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(crontab_content.as_bytes())
            .map_err(|e| format!("Failed to write to crontab: {}", e))?;
    }

    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to wait for crontab: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

pub async fn delete_job(id: String) -> Result<(), String> {
    let mut existing_jobs = list_jobs().await?;
    
    // Parse id as index
    let index: usize = id.parse()
        .map_err(|_| "Invalid job ID".to_string())?;
    
    if index >= existing_jobs.len() {
        return Err("Job ID out of range".to_string());
    }
    
    existing_jobs.remove(index);
    
    // Write back to crontab
    let crontab_content = existing_jobs.join("\n") + "\n";
    
    let mut child = Command::new("crontab")
        .arg("-")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn crontab: {}", e))?;

    use std::io::Write;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(crontab_content.as_bytes())
            .map_err(|e| format!("Failed to write to crontab: {}", e))?;
    }

    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to wait for crontab: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}
