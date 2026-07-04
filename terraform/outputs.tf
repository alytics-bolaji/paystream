output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.paystream.name
}


output "cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.paystream.endpoint
}


output "ecr_urls" {
  description = "ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.paystream : k => v.repository_url }
}


output "kubeconfig_command" {
  description = "Command to update local kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.paystream.name}"
}


output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.paystream_config.arn
}
