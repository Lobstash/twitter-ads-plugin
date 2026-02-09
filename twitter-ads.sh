#!/bin/bash

# Twitter Ads CLI Shell Wrapper
# Usage: ./twitter-ads.sh <command> [args...]

cd /root/.openclaw/workspace/skills/twitter-ads && npx ts-node cli.ts "$@"