### 1. Install docker:
  - [For desktop](https://www.docker.com/products/docker-desktop)
  - [For Ubuntu server](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04)
    
### 2. [Install docker-compose](https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04)
### 3. Configs:
 - Mongo: add secrets folder with mongo auth config
 - RabbitMQ:
   + Copy rabbitmq/rabbitmq-isolated.template to rabbitmq/rabbitmq-isolated.conf
   + And config user account in rabbitmq/rabbitmq-isolated.conf
 - Redis: config at redis/redis.conf
   + Copy redis/redis.template to redis/redis.conf
   + Modify to your config in redis/redis.conf
 - Docker yml:
   + Copy file docker-compose.template to docker-compose.conf
   + Update port config to your above rabbitmq and redis configs
 
### 4. Start docker:

````bash
docker-compose up -d
docker exec -it tesse-backend bash
````
