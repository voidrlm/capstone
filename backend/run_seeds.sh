#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Note: Corrected a few typos from your request based on the package.json scripts

echo "Starting database migration..."
# Matches your request for 'db:migrtt:drugs', corrected to the available script:
npm run db:migrate

echo "Seeding users and test patients..."
npm run db:seed

echo "Starting OpenFDA seed..."
# Matches your request for 'deed:openfda', corrected to the available script:
npm run seed:openfda

echo "Starting drugs seed..."
# Matches your exact request:
npm run seed:drugs

echo "All commands executed successfully!"
