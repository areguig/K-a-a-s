.PHONY: up down logs ps clean rebuild

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# View running containers
ps:
	docker-compose ps

# Clean up containers, images, and volumes
clean:
	docker-compose down -v --rmi all

# Rebuild and restart services
rebuild:
	docker-compose build --no-cache
	docker-compose up -d
