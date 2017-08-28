
// from cesium-lg/server.js & websocket-relay.pl used as a skeleton //Ali 17433668
// 20160825 websocket-relay.pl converted to javascript/NodeJS
// 20161010 Jon Record Function
// 20161108 Alf strip back & refactor, correct broken client id, use client address + port
// 20170820 try/catches on ws.send()

var DEBUG = false,
    HTTP = require('http'),
    WS = require('ws'),

    CONFIG = {
      NODE_IP: 'localhost', // not used ?
      NODE_PORT: 3000,
    };

( function() {
  'use strict';

  var httpServer = HTTP.createServer();

  httpServer.listen( CONFIG.NODE_PORT, function() {
    if (DEBUG) console.log("Relay listening on *:" + CONFIG.NODE_PORT);
  });

  var wsServer = new WS.Server( { server: httpServer } ),
      wsClients = new Array(),
      noOfClients = 0,
      lastMessage, masterClientAddrPort;

  wsServer.on( 'connection', function( socket ) {

    var clientAddrPort = socket._socket.remoteAddress + ':' + socket._socket.remotePort;

    noOfClients++;
    wsClients[ clientAddrPort ] = socket;

    if (DEBUG) console.log('New client ' + clientAddrPort + ' ('+ noOfClients +' clients)');

    socket.on( 'message', function( messageData, flags ) {

       if (DEBUG) console.log( 'Mesg:' + messageData );

       var command = messageData.split(',')[0];

       switch (command) {
         case "MASTER":
	   masterClientAddrPort = clientAddrPort;
	   if (DEBUG) console.log( 'Client '+ masterClientAddrPort + ' is declaring master.' );
	   break;

         case "RESEND":
           try { wsClients[ clientAddrPort ].send( lastMessage ); }
           catch (e) { console.log('resend: send error'); }
	   break;

         case "NOOFCLIENTS": // tell Master the number of connected clients
           if (DEBUG) console.log( 'NoofClients:' + noOfClients );
           if (masterClientAddrPort !== undefined) {
             try { wsClients[masterClientAddrPort].send( 'NOOFCLIENTS,' + noOfClients.toString() ); }
             catch (e) { console.log('noofclients: send error'); }
           } else {
             if (DEBUG) console.log( 'noofclients: Master not defined');
           }
           break;

         case "REQUESTSTATE": // only to master
           if (masterClientAddrPort !== undefined) {
             try { wsClients[masterClientAddrPort].send( messageData ); }
             catch (e) { console.log('requeststate: send error'); }
           } else {
             if (DEBUG) console.log( 'requeststate: Master not defined');
           }
           break;

         default: // do the relay thing
           for (var i in wsClients) {
             if (i != clientAddrPort && i != masterClientAddrPort) { // don't send to self or master
               //console.log( 'sending to i=' + i );
               try { wsClients[i].send( messageData ); }
               catch (e) { console.log('relay: send error'); }
             }
           }
           lastMessage = messageData;
           break;
       }
   }); // end socket.on 'message'

   socket.on( 'close', function( reasonCode, description ) {
      delete wsClients[ clientAddrPort ];
      noOfClients--;
      console.log('Client ' + clientAddrPort + ' disconnected. Now '+ noOfClients +' clients.');
   });

  }); // end wsServer.on()

  httpServer.on( 'error', function( e ) {
    if ( e.code === 'EADDRINUSE' ) {
      console.log('Error: Port ' + CONFIG.NODE_PORT + ' already in use.');
    } else if ( e.code === 'EACCES' ) {
      console.log('Error: No permission to listen on port ' + CONFIG.NODE_PORT);
    }
    console.log( e );
    process.exit( 1 );
  });

  httpServer.on( 'close', function() {
    console.log( 'Relay Server stopped.' );
  });

  process.on( 'SIGINT', function() {
    console.log( 'Relay Server stopping.' );
    process.exit( 1 );
  });

})();
