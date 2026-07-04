# ── AWS Secrets Manager ──────────────────────────────────────────────
resource "aws_secretsmanager_secret" "paystream_config" {
  name                    = "paystream/production/config"
  description             = "PayStream production configuration secrets"
  recovery_window_in_days = 7
}


resource "aws_secretsmanager_secret_version" "paystream_config" {
  secret_id = aws_secretsmanager_secret.paystream_config.id
  secret_string = jsonencode({
    NOTIFICATION_SERVICE_URL = "http://notification-service.paystream.svc.cluster.local:3005"
    ENVIRONMENT              = "production"
    LOG_LEVEL                = "info"
  })
}


# IAM policy to allow EKS pods to read secrets
resource "aws_iam_policy" "secrets_reader" {
  name = "paystream-secrets-reader"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
      Resource = aws_secretsmanager_secret.paystream_config.arn
    }]
  })
}
