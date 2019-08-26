### NOTE: Nothing *sensitive* should be present here
###       If required, move to auth.tf

variable "whitelisted_ip_blocks" {
    description = "List of known-good IPs to allow connections from"
    type        = list(string)
    default     = ["130.217.0.0/16", "118.92.51.119/32"]
}

variable "public_key_path" {
    description = "Path to OpenSSH (RSA) public key"
    type        = string
    default     = "./deployer.pub"
}

variable "server_port" {
    description = "Port used by our server"
    type        = number 
    default     = 80
}

variable "instance_count" {
    description = "Number of EC2 instances to run"
    type        = number
    default     = 3
}
