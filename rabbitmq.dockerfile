FROM rabbitmq:3.10-management

RUN apt-get update
RUN apt-get install -y curl

EXPOSE 4369 5671 5672 25672 15671 15672