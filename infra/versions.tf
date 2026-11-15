terraform {
  required_version = ">= 1.7, < 2.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.29.0"
    }
  }
}

# Authentication is read from CLOUDFLARE_API_TOKEN in the operator's environment.
provider "cloudflare" {}
