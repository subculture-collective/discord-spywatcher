output "redis_endpoint" {
  description = "Redis primary endpoint address"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

output "security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}

output "secret_arn" {
  description = "ARN of the secret containing Redis auth token"
  value       = aws_secretsmanager_secret.redis_auth.arn
}
