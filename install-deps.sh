#!/usr/bin/env bash
set -euo pipefail

# Initialize package.json if missing
[ -f package.json ] || npm init -y

deps=(
  "@prisma/client"
  "@supabase/auth-helpers-nextjs"
  "@supabase/supabase-js"
  "bullmq"
  "date-fns"
  "ioredis"
  "fluent-ffmpeg"
  "ffmpeg-static"
  "@ffprobe-installer/ffprobe"
  "mime"
  "next"
  "react"
  "react-dom"
  "tus-js-client"
  "zod"
  "resend"
  "clsx"
  "tailwind-merge"
  "class-variance-authority"
)

dev_deps=(
  "@types/node"
  "@types/react"
  "@types/react-dom"
  "autoprefixer"
  "dotenv-cli"
  "eslint"
  "eslint-config-next"
  "postcss"
  "prisma"
  "tailwindcss"
  "tsx"
  "typescript"
  "husky"
)

echo "Installing dependencies..."
npm i "${deps[@]}"

echo "Installing devDependencies..."
npm i -D "${dev_deps[@]}"

echo "Done."

