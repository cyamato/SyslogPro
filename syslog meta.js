 send (msg) {
    return new Promise((resolve, reject) => {
      if (typeof msg !== 'string') {
        reject(new Error("TYPE ERROR: Syslog message must be a string"));
        return;
      }
      
      // Test for target DNS and Address Family (IPv4/6) by looking up the DNS
      const dnsOptions = {
        verbatim: true
      };
      dnsPromises.lookup(this.target, dnsOptions)
          .then((result) => {
            // Turn msg in to a UTF8 buffer
            const msgBuffer = Buffer.from(msg, 'utf8');
            
            if (this.protocol === 'udp') {
              // Do UDP transport
              const dgram = require('dgram');
              const udpType = result.family === 4 ? 'udp4' : 'udp6';
              const udpClient = dgram.createSocket(udpType);
              
              udpClient.send(msgBuffer, this.port, result.address, (error) => {
                udpClient.close();
                resolve(msg);
              });
            } else if (this.protocol === 'tcp') {
              // Use TCP client
              const net = require('net');
              const tcpOptions = {
                host: result.address,
                port: this.port,
                family: result.family
              };
              
              const client = net.createConnection(tcpOptions, () => {
                client.write(msgBuffer, () => {
                  client.end();
                });
              });
              client.setTimeout(this.tcpTimeout);
              
              // client.on('data', (data) => {});
              client.on('end', () => {
                resolve(msg);
              });
              client.on('timeout', () => {
                client.end();
                reject(new Error('TIMEOUT ERROR: Syslog server TCP timeout'));
              });
              client.on('error', (error) => {
                client.destroy();
                reject(error);
              });
            } else if (this.protocol === 'tls') {
              //  Use a TLS client
              const tls = require('tls');
              const tlsOptions = {
                host: this.target,
                port: this.port,
                family: result.family
              };
              
              if (typeof this.tlsClientKey === 'string' 
                  && typeof this.tlsClientCert === 'string') {
                tlsOptions.key = fs.readFileSync(this.tlsClientKey);
                tlsOptions.cert = fs.readFileSync(this.tlsClientCert);      
              } else if (typeof this.tlsClientKey !== 'string' 
                  && typeof this.tlsClientKey !== 'undefined') {
                let errMsg = 'TYPE ERROR: TLS Client Key is not a file';
                errMsg += 'location string';
                reject(new Error(errMsg));
                return;
              } else if (typeof this.tlsClientCert !== 'string' 
                  && typeof this.tlsClientCert !== 'undefined') {
                let errMsg = 'TYPE ERROR: TLS Client Cert is not a file';
                errMsg += 'location string';
                reject(new Error(errMsg));
                return;
              }
              
              let tlsCerts = this.tlsServerCerts.length;
              if (tlsCerts > 0) {
                let tlsOptionsCerts = [];
                for (let certIndex=0; certIndex<tlsCerts; certIndex++) {
                  if (typeof this.tlsServerCerts[certIndex] !== 'string') {
                    let errMsg = 'TYPE ERROR: TLS Server Cert is not a file';
                    errMsg += 'location string';
                    reject(new Error(errMsg));
                  }
                  let cert = fs.readFileSync(this.tlsServerCerts[certIndex]);
                  tlsOptionsCerts.push(cert);
                }
                tlsOptions.ca = tlsOptionsCerts;
                tlsOptions.rejectUnauthorized = true;
              }
              
              const client = tls.connect(tlsOptions, () => { 
                client.write(msgBuffer, () => {
                  client.end();
                });
              });
              client.setTimeout(this.tcpTimeout);
              
              // client.on('data', (data) => {});
              client.on('end', () => {
                resolve(msg);
              });
              client.on('timeout', () => {
                client.end();
                reject(new Error('TIMEOUT ERROR: Syslog server TLS timeout'));
              });
              client.on('error', (error) => {
                client.destroy();
                reject(error);
              });
            } else {
              reject(new Error('FORMAT ERROR: Protocol is not UDP|TCP|TLS'));
            }
          })
          .catch((error) => {
            reject(error); // Reject out of the sendMessage function promise
          });
    });
  }
}