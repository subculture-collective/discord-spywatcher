output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "db_address" {
  description = "RDS instance address"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "Master username"
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "secret_arn" {
  description = "ARN of the secret containing database credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}
