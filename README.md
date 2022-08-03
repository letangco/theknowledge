# Tesse Backend service
### I. Run development:
 1.  Run with docker:
 - Config docker:
   + Copy file docker-compose.template to docker-compose.yml and update to your config
 - Config mongo:
   + Extract file mongo/secrets.zip.
   + Config mongo authentication.
 - Config redis:
   + Copy file redis.template.conf to redis.conf and update to your config
   + For secure let update the **port**, **requirepass**
 - Config rabbitmq:
   + Copy file rabbitmq_management.template.conf to rabbitmq_management.conf and update to your config
 - Config env:
   + Copy file sample.env to .env and update to your config
 - Config hook env:
   + Copy file sample.hook.env to .hook.env and update to your config
 - Start docker:
     ````bash
       docker-compose up -d
     ````
 - Enter docker:
     ````bash
        docker exec -it tesse-backend bash
     ````
 - Run backend development:
    ````bash
        npm start
    ````
### II. Run production:
For best performance, install all third services manually and run with production mode
````bash
    // Run main API service
    npm run prod
    // Run Upload service
    npm run cloud
    // Run Worker service, must run after the API service already running
    npm run worker
    // Run Room hook api entry
    npm run hook
````
 - Config nginx:
   + Cloud:
   + Hook:
 - Hook API config:
   + Default use the API service hooks API entry
   + Or run the Room hook service to make the API entry for room hooks
### III. Other script:
 - Re-index data for elasticsearch:
````bash
    npm run elasticsearch
````
 - Clean room hook:
````bash
    npm run clean:hook
````
