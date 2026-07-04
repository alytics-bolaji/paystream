# ── ECR Repositories ─────────────────────────────────────────────────
locals {
  services = ["frontend", "payment-service", "notification-service"]
}


resource "aws_ecr_repository" "paystream" {
  for_each             = toset(local.services)
  name                 = "paystream/${each.key}"
  image_tag_mutability = "MUTABLE"


  image_scanning_configuration { scan_on_push = true }
  encryption_configuration { encryption_type = "AES256" }


  tags = { Name = "paystream-${each.key}" }
}


# Lifecycle policy: keep only last 10 images per repo
resource "aws_ecr_lifecycle_policy" "paystream" {
  for_each   = aws_ecr_repository.paystream
  repository = each.value.name


  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
      action       = { type = "expire" }
    }]
  })
}
