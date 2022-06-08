# Daily Trip Enhancer
## Scopo del progetto
Stanco del solito viaggio giornaliero da/verso la scuola o il lavoro? Con Daily Trip Enhancer potrai mettere fine alla noia con una playlist personalizzata e dalla durata perfetta per ogni tuo viaggio, e se ti sposti con i mezzi pubblici o a piedi potrai anche fare nuove amicizie attraverso la chat!
## Architettura di riferimento
![Architettura](architettura.png)
## Tecnologie usate
### [Docker (compose)](https://www.docker.com/)
Costruisce ed avvia la seguente architettura
#### [NGINX](https://www.nginx.com/)
- *Sicurezza*: parla **solo** HTTPS/2 con l'esterno, aggiorna da connessioni HTTP a HTTPS, usa certificato self-signed con scambio di chiavi Diffie-Hellman
- Parla HTTP/1.1 con *SERV*
- *Gestione del traffico*: reverse proxy (con load balancing)
- Server per i file statici (css, fonts, scripts)
#### [Node.js](https://nodejs.org/)
- 3 istanze
- Librerie utilizzate per SERV: **express** (HTTP), **passport** (OAuth), **socket.io** (WebSocket)
- Librerie utilizzate per i test: **mocha** con assertion library **chai**
#### [MongoDB](https://www.mongodb.com/)
- Sessioni degli utenti
- Memorizzazione token OAuth degli utenti
#### [RabbitMQ](https://www.rabbitmq.com/)
- Le WebSocket, girando sulle 3 diverse istanze dell'app, non sono sincronizzate
- RabbitMQ garantisce la sincronizzazione delle WebSocket, e quindi della chat
- Per la comunicazione si utilizza il protocollo AMQP
### [GitHub Actions](https://github.com/features/actions)
CI/CD, vengono effettuati i test con Mocha dopo ogni push o pull request in master

## Servizi REST
### Utilizzati da *SERV*
#### Commerciali
- [Spotify (OAuth)](https://developer.spotify.com/)
#### Non commerciali
- [zippopotam.us](https://www.zippopotam.us/)
- [Openrouteservice](https://openrouteservice.org/)
### Offerti da *SERV*
TODO: aggiungere con apidoc
## Installazione
```console
git clone https://github.com/Infiniteez/progettorc.git
cd progettorc
docker compose build
```
## Avvio
```console
docker compose up
```
## Test
```console
cd app
npm install && npm test
```