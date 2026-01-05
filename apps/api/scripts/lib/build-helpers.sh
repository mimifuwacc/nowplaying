#!/bin/bash

blue() {
  echo -e "\033[34m$1\033[0m"
}

green() {
  echo -e "\033[32m$1\033[0m"
}

get_project_root() {
  local script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
  cd "$script_dir/.." && pwd
}
