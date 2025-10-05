

export function getInstallNginxCommand(): string {
  return 'sudo apt-get install -y nginx && sudo systemctl start nginx && sudo systemctl enable nginx';
}
