const SyslogPro = require("../index");
const os = require("os");
const udp = require('dgram');
const net = require('net');
const tls = require('tls');
const fs = require('fs');
const dns = require('dns');
let dnsPromises = dns.promises;

function setupServers () {
  return new Promise ((resolve, reject) => {
    // Load a UDP server
    // global.udpServerPort = 8000;
    this.udpServer = udp.createSocket('udp4');
    this.udpServer.bind(global.udpServerPort, () => {
      // console.log('UDP server running on', global.udpServerPort);
    });
    
    // Load a TCP server
    // global.tcpServerPort = 8001;
    this.tcpServer = net.createServer((socket) => {
      socket.on('data', function (data) {});
      socket.on('end', function () {});
    });
    this.tcpServer.listen(global.tcpServerPort, () => {
      // console.log('TCP server running on', global.tcpServerPort);
    });
    
    // Load a basic TLS 
    // global.tlsBasicServerPort = 8002;
    const tlsBasicServerOptions = {
      key: fs.readFileSync('./tests/jest_test_server_key.pem'),
      cert: fs.readFileSync('./tests/jest_test_server_cert.pem'),
      handshakeTimeout: 100,
      requestCert: false,
      rejectUnauthorized: false
    };
    this.tlsBasicServer = tls.createServer(tlsBasicServerOptions, (socket) => {
      socket.on('data', function (data) {});
      socket.on('end', function() {}); 
    });
    this.tlsBasicServer.listen(global.tlsBasicServerPort, () => {
      // console.log('TLS basic server running on', global.tlsBasicServerPort);
    });
    
    // Load a TLS server with client Cert request
    // global.tlsAuthServerPort = 8003;
    const tlsAuthServerOptions = {
      key: fs.readFileSync('./tests/jest_test_server_key.pem'),
      cert: fs.readFileSync('./tests/jest_test_server_cert.pem'),
      ca: [ fs.readFileSync('./tests/jest_test_client_cert.pem') ],
      handshakeTimeout: 100,
      requestCert: true,
      rejectUnauthorized: true
    };
    this.tlsAuthServer = tls.createServer(tlsAuthServerOptions, (socket) => {
      socket.on('data', function (data) {});
      socket.on('end', function() {}); 
    });
    this.tlsAuthServer.listen(global.tlsAuthServerPort, () => {
      // console.log('TLS auth server running on', global.tlsAuthServerPort);
    });
  });
}

function teardownServers() {
  return new Promise ((resolve, reject) => {
    this.udpServer.close(() => {
      // console.log('UDP server closed');
    });
    this.tcpServer.close(() => {
      // console.log('TCP server closed');
    });
    this.tlsBasicServer.close(() => {
      // console.log('TLS basic server closed');
    });
    this.tlsAuthServer.close(() => {
      // console.log('TLS auth server closed');
    });
  });
}

beforeAll(() => {
  setupServers().then((result => {}));
});

afterAll(() => {
  teardownServers().then((result => {}));
});

// CEF Class Tests
describe('CEF Class Tests', () => {
  test('CEF Validate with bad extension type ERROR', (done) => {
    let syslogOptions = {
      port:global.tcpServerPort+100,
      protocol: 'tcp'
    };
    let cef = new SyslogPro.CEF({
      server: syslogOptions,
      extensions: {
        deviceAction: []
      }
    });
    expect.assertions(1);
    return cef.validate({})
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: CEF Key deviceAction value type was '; 
          errorMsg += 'expected to be string';
          expect(reson.message).toBe(errorMsg);
          done();
        });
  });
  test('CEF Validate with bad extension value length ERROR', (done) => {
    let cef = new SyslogPro.CEF({
      extensions: {
        myNewExt: 'test',
        applicationProtocol: '1234567890abcdefghijklmnopqrustwxyz'
      },
      severity: 6
    });
    expect.assertions(1);
    return cef.validate({})
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'FORMAT ERROR: CEF Extention Key applicationProtocol '; 
          errorMsg += 'value length is to long; max length is 31';
          expect(reson.message).toBe(errorMsg);
          done();
        });
  });
  test('CEF Validate with bad Severity ERROR', (done) => {
    let cef = new SyslogPro.CEF();
    cef.severity = 'BAD';
    expect.assertions(1);
    return cef.validate()
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errMsg = 'TYPE ERROR: CEF Severity not set correctly';
          expect(reson.message).toBe(errMsg);
          done();
        });
  });
  test('CEF Validate with bad device information ERROR', (done) => {
    let cef = new SyslogPro.CEF();
    cef.deviceProduct = {};
    expect.assertions(1);
    return cef.validate()
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errMsg = 'TYPE ERROR: CEF Device Info must be a string';
          expect(reson.message).toBe(errMsg);
          done();
        });
  });
  test('CEF Validate and Send A UDP Message to ::1', (done) => {
    let cef = new SyslogPro.CEF(
      {
        extensions: {
          deviceAction: 'block'
        }    
      }
    );
    expect.assertions(1);
    return cef.validate()
        .then((result) => {
          cef.send({
            target: '::1',
            port:global.udpServerPort
          })
              .then((result) => {
                let validateMsg = 'CEF:0|Unknown|Unknown|Unknown|Unknown|Unknown';
                validateMsg += '|Unknown|deviceAction=block ';
                expect(result).toBe(validateMsg);
                done();
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('CEF Send over TCP with bad port ERROR', (done) => {
    let syslog = new SyslogPro.Syslog({
      target: '127.0.0.1',
      port: global.tcpServerPort+100,
      protocol: 'tcp'
    });
    let cef = new SyslogPro.CEF({
      server: syslog
    });
    expect.assertions(1);
    return cef.send({})
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          expect(reson.message).toBe('connect ECONNREFUSED 127.0.0.1:8101');
          done();
        });
  });
});

// LEEF Class Test
describe('LEEF Class Tests', () => {
  test('LEEF Send over TLS with bad port ERROR', (done) => {
    let syslog = new SyslogPro.Syslog({
      port: global.tlsBasicServerPort+100,
      protocol: 'tls',
      tlsServerCerts: ['./tests/jest_test_server_cert.pem']
    });
    let leef = new SyslogPro.LEEF({
      vendor: 'test',
      product: 'test',
      version: 'qweq',
      eventId: 'et',
      syslogHeader: false,
      attributes: {
        cat: 'net'
      },
      server: syslog
    });
    expect.assertions(1);
    return leef.send()
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          expect(reson.message).toBe('connect ECONNREFUSED 127.0.0.1:8102');
          done();
        });
  });
  test('LEEF Send', (done) => {
    let leef = new SyslogPro.LEEF();
    expect.assertions(1);
    return leef.send()
        .then((result) => {
          expect(result).toBe('LEEF:2.0|unknown|unknown|unknown|unknown|');
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('LEEF Send with Auth TLS options', (done) => {
    let syslogOptions = {
      port: global.tlsAuthServerPort,
      protocol: 'tls',
      tlsServerCerts: ['./tests/jest_test_server_cert.pem'],
      tlsClientCert: './tests/jest_test_client_cert.pem',
      tlsClientKey: './tests/jest_test_client_key.pem',
    };
    let leef = new SyslogPro.LEEF({
      server: syslogOptions
    });
    expect.assertions(1);
    return leef.send()
        .then((result) => {
          expect(result).toBe('LEEF:2.0|unknown|unknown|unknown|unknown|');
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
});

// RFC5424 Class Test
describe('RFC5424 Class Tests', () => {
  test('RFC5424 Sending critical - debug Severity Messages', (done) => {
    let rfc5424 = new SyslogPro.RFC5424();
    expect.assertions(7);
    rfc5424.debug('test')
        .then((result) => {
          expect(result).toMatch(/<191>1 /);   
          rfc5424.log('test')
              .then((result) => {
                expect(result).toMatch(/<190>1 /);   
                rfc5424.info('test')
                    .then((result) => {
                      expect(result).toMatch(/<190>1 /);      
                      rfc5424.note('test')
                          .then((result) => {
                            expect(result).toMatch(/<189>1 /);      
                            rfc5424.warn('test')
                                .then((result) => {
                                  expect(result).toMatch(/<188>1 /);      
                                  rfc5424.err('test')
                                      .then((result) => {
                                        expect(result).toMatch(/<187>1 /);      
                                        rfc5424.crit('test')
                                            .then((result) => {
                                              expect(result).toMatch(/<186>1 /);   
                                              done();
                                            })
                                            .catch((reson) => {
                                              console.log(reson);
                                            });
                                      })
                                      .catch((reson) => {
                                        console.log(reson);
                                      });
                                })
                                .catch((reson) => {
                                  console.log(reson);
                                });
                          })
                          .catch((reson) => {
                            console.log(reson);
                          });
                    })
                    .catch((reson) => {
                      console.log(reson);
                    });
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RFC5424 Sending emergency - alert Severity Messages', (done) => {
    let syslog = new SyslogPro.Syslog();
    let rfc5424 = new SyslogPro.RFC5424({
      server: syslog
    });
    expect.assertions(2);
    rfc5424.alert('test')
        .then((result) => {
          expect(result).toMatch(/<185>1 /);   
          rfc5424.emer('test')
              .then((result) => {
                expect(result).toMatch(/<184>1 /);   
                done();
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RFC5424 Send with a bad message type ERROR', (done) => {
    let rfc5424 = new SyslogPro.RFC5424();
    expect.assertions(1);
    rfc5424.send([])
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errMsg = 'FORMAT ERROR: Syslog message must be a string ';
          errMsg += 'msgSeverity must be a number between 0 and 7';
          expect(reson.message).toBe(errMsg);
          done();
        });
  });
  test('RFC5424 Send with a bad port number ERROR', (done) => {
    let rfc5424 = new SyslogPro.RFC5424({
      utf8BOM: false,
      timestampUTC: true,
      timestampTZ: false,
      timestampMS: true,
      encludeStructuredData: true,
      colors: {
          emergencyColor: 30,
          alertColor: 30,
          criticalColor: 30,
          errorColor: 30,
          warningColor:30,
          noticeColor: 30,
          informationalColor: 30,
          debugColor: 30
      },
      server: {
        target: '127.0.0.1',
        port: global.tcpServerPort+100,
        protocol: 'tcp'
      }
    });
    expect.assertions(1);
    rfc5424.send('hello')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errMsg = 'connect ECONNREFUSED 127.0.0.1:8101';
          expect(reson.message).toBe(errMsg);
          done();
        });
  });
  test('RFC5424 BuildMessage with Timestamp options', (done) => {
    expect.assertions(9);
    let rfc5424 = new SyslogPro.RFC5424({
      color: true,
      timestamp: false,
      timestampUTC: false,
      timestampTZ: false,
      timestampMS: false,
    });
    rfc5424.buildMessage('hello')
        .then((result) => {
          expect(result).toMatch(/<190>1 - /);
          let rfc5424 = new SyslogPro.RFC5424({
            color: true,
            extendedColor: true,
            timestamp: true,
            timestampUTC: false,
            timestampTZ: false,
            timestampMS: false,
          });
          rfc5424.buildMessage('hello',{
            msgColor: 50
          })
              .then((result) => {
                let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} /;
                expect(result).toMatch(resultMsg);
                let rfc5424 = new SyslogPro.RFC5424({
                  encludeStructuredData: true,
                  color: true,
                  extendedColor: false,
                  timestamp: true,
                  timestampUTC: false,
                  timestampTZ: false,
                  timestampMS: true,
                });
                rfc5424.buildMessage('hello', {
                  msgColor: 30,
                  msgStructuredData: [
                    '[ourSDID@32473 test=test]',
                    '[ourSDID@32473 test=test]'
                  ]
                })
                    .then((result) => {
                      let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6} /;
                      expect(result).toMatch(resultMsg);
                      let rfc5424 = new SyslogPro.RFC5424({
                        timestamp: true,
                        timestampUTC: false,
                        timestampTZ: true,
                        timestampMS: true,
                      });
                      rfc5424.buildMessage('hello')
                          .then((result) => {
                            let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+/;
                            expect(result).toMatch(resultMsg);
                            let rfc5424 = new SyslogPro.RFC5424({
                              timestamp: true,
                              timestampUTC: false,
                              timestampTZ: true,
                              timestampMS: false,
                            });
                            rfc5424.buildMessage('hello')
                                .then((result) => {
                                  let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+/;
                                  expect(result).toMatch(resultMsg);
                                  let rfc5424 = new SyslogPro.RFC5424({
                                    timestamp: true,
                                    timestampUTC: true,
                                    timestampTZ: false,
                                    timestampMS: false,
                                  });
                                  rfc5424.buildMessage('hello')
                                      .then((result) => {
                                        let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} /;
                                        expect(result).toMatch(resultMsg);
                                        let rfc5424 = new SyslogPro.RFC5424({
                                          timestamp: true,
                                          timestampUTC: true,
                                          timestampTZ: false,
                                          timestampMS: true,
                                        });
                                        rfc5424.buildMessage('hello')
                                            .then((result) => {
                                              let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6} /;
                                              expect(result).toMatch(resultMsg);
                                              let rfc5424 = new SyslogPro.RFC5424({
                                                timestamp: true,
                                                timestampUTC: true,
                                                timestampTZ: true,
                                                timestampMS: true,
                                              });
                                              rfc5424.buildMessage('hello')
                                                  .then((result) => {
                                                    let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+/;
                                                    expect(result).toMatch(resultMsg);
                                                    let rfc5424 = new SyslogPro.RFC5424({
                                                      timestamp: true,
                                                      timestampUTC: true,
                                                      timestampTZ: true,
                                                      timestampMS: false,
                                                    });
                                                    rfc5424.buildMessage('hello')
                                                        .then((result) => {
                                                          let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+/;
                                                          expect(result).toMatch(resultMsg);
                                                          done();
                                                        })
                                                        .catch((reson) => {
                                                          console.log(reson);
                                                        });
                                                  })
                                                  .catch((reson) => {
                                                    console.log(reson);
                                                  });
                                            })
                                            .catch((reson) => {
                                              console.log(reson);
                                            });
                                      })
                                      .catch((reson) => {
                                        console.log(reson);
                                      });
                                })
                                .catch((reson) => {
                                  console.log(reson);
                                });
                          })
                          .catch((reson) => {
                            console.log(reson);
                          });
                    })
                    .catch((reson) => {
                      console.log(reson);
                    });
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RFC5424 SetColors', (done) => {
    expect.assertions(1);
    let rfc5424 = new SyslogPro.RFC5424();
    rfc5424.setColor({
          emergencyColor: 30,
          alertColor: 30,
          criticalColor: 30,
          errorColor: 30,
          warningColor:30,
          noticeColor: 30,
          informationalColor: 30,
          debugColor: 30
      },
      false)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RFC5424 SetColors with color type ERROR', (done) => {
    expect.assertions(8);
    let rfc5424 = new SyslogPro.RFC5424();
    rfc5424.setColor({
      emergencyColor: {}
    }, false)
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: ';
          errorMsg += 'emergencyColor';
          errorMsg += ' Not in RGB color hex or color code';
          expect(reson.message).toBe(errorMsg);
          rfc5424.setColor({
            alertColor: {}
          }, false)
              .then((result) => {
                console.log(result);
              })
              .catch((reson) => {
                let errorMsg = 'TYPE ERROR: ';
                errorMsg += 'alertColor';
                errorMsg += ' Not in RGB color hex or color code';
                expect(reson.message).toBe(errorMsg);
                rfc5424.setColor({
                  criticalColor: {}
                }, false)
                    .then((result) => {
                      console.log(result);
                    })
                    .catch((reson) => {
                      let errorMsg = 'TYPE ERROR: ';
                      errorMsg += 'criticalColor';
                      errorMsg += ' Not in RGB color hex or color code';
                      expect(reson.message).toBe(errorMsg);
                      rfc5424.setColor({
                        errorColor: {}
                      }, false)
                          .then((result) => {
                            console.log(result);
                          })
                          .catch((reson) => {
                            let errorMsg = 'TYPE ERROR: ';
                            errorMsg += 'errorColor';
                            errorMsg += ' Not in RGB color hex or color code';
                            expect(reson.message).toBe(errorMsg);
                            rfc5424.setColor({
                              warningColor: {}
                            }, false)
                                .then((result) => {
                                  console.log(result);
                                })
                                .catch((reson) => {
                                  let errorMsg = 'TYPE ERROR: ';
                                  errorMsg += 'warningColor';
                                  errorMsg += ' Not in RGB color hex or color code';
                                  expect(reson.message).toBe(errorMsg);
                                  rfc5424.setColor({
                                    noticeColor: {}
                                  }, false)
                                      .then((result) => {
                                        console.log(result);
                                      })
                                      .catch((reson) => {
                                        let errorMsg = 'TYPE ERROR: ';
                                        errorMsg += 'noticeColor';
                                        errorMsg += ' Not in RGB color hex or color code';
                                        expect(reson.message).toBe(errorMsg);
                                        rfc5424.setColor({
                                          informationalColor: {}
                                        }, false)
                                            .then((result) => {
                                              console.log(result);
                                            })
                                            .catch((reson) => {
                                              let errorMsg = 'TYPE ERROR: ';
                                              errorMsg += 'informationalColor';
                                              errorMsg += ' Not in RGB color hex or color code';
                                              expect(reson.message).toBe(errorMsg);
                                              rfc5424.setColor({
                                                debugColor: {}
                                              }, false)
                                                  .then((result) => {
                                                    console.log(result);
                                                  })
                                                  .catch((reson) => {
                                                    let errorMsg = 'TYPE ERROR: ';
                                                    errorMsg += 'debugColor';
                                                    errorMsg += ' Not in RGB color hex or color code';
                                                    expect(reson.message).toBe(errorMsg);
                                                    done();
                                                  });
                                            });
                                      });
                                });
                          });
                    });
              });
        });
  });
  test('RFC5424 buildMessage color options', (done) => {
    expect.assertions(2);
    let rfc5424 = new SyslogPro.RFC5424({
      color: true,
      extendedColor: true
    });
    rfc5424.buildMessage('test', {
      msgColor: 30
    })
        .then((result) => {
          expect(result).toMatch(/<190>1 .+(\u001b\[38;5;30mtest\u001b\[0m\n)/);
          rfc5424.extendedColor = false;
          rfc5424.buildMessage('test', {
            msgColor: {}
          })
              .then((result) => {
                expect(result).toMatch(/<190>1 .+(\u001b\[39mtest\u001b\[0m\n)/);
                done();
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
});

// RFC3164 Class Test
describe('RFC3164 Class Tests', () => {
  test('RFC3164 Sending critical - debug Severity Messages', (done) => {
    let rfc3164 = new SyslogPro.RFC3164();
    expect.assertions(7);
    rfc3164.debug('test')
        .then((result) => {
          expect(result).toMatch(/<191>J|F|M|A|S|O|N|D/);   
          rfc3164.log('test')
              .then((result) => {
                expect(result).toMatch(/<190>J|F|M|A|S|O|N|D/);   
                rfc3164.info('test')
                    .then((result) => {
                      expect(result).toMatch(/<190>J|F|M|A|S|O|N|D/);      
                      rfc3164.note('test')
                          .then((result) => {
                            expect(result).toMatch(/<189>J|F|M|A|S|O|N|D/);      
                            rfc3164.warn('test')
                                .then((result) => {
                                  expect(result).toMatch(/<188>J|F|M|A|S|O|N|D/);      
                                  rfc3164.err('test')
                                      .then((result) => {
                                        expect(result).toMatch(/<187>J|F|M|A|S|O|N|D/);      
                                        rfc3164.crit('test')
                                            .then((result) => {
                                              expect(result).toMatch(/<186>J|F|M|A|S|O|N|D/);   
                                              done();
                                            })
                                            .catch((reson) => {
                                              console.log(reson);
                                            });
                                      })
                                      .catch((reson) => {
                                        console.log(reson);
                                      });
                                })
                                .catch((reson) => {
                                  console.log(reson);
                                });
                          })
                          .catch((reson) => {
                            console.log(reson);
                          });
                    })
                    .catch((reson) => {
                      console.log(reson);
                    });
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RFC3164 Sending TCP emergency - alert Severity Messages', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tcp',
      port: global.tcpServerPort
    });
    let rfc3164 = new SyslogPro.RFC3164({
      server: syslog
    });
    expect.assertions(2);
    rfc3164.alert('test')
        .then((result) => {
          expect(result).toMatch(/<185>J|F|M|A|S|O|N|D/);   
          rfc3164.emer('test')
              .then((result) => {
                expect(result).toMatch(/<184>J|F|M|A|S|O|N|D/);   
                done();
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RFC3164 Send with a bad message type ERROR', (done) => {
    let rfc3164 = new SyslogPro.RFC3164();
    expect.assertions(1);
    rfc3164.send([])
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errMsg = 'FORMAT ERROR: Syslog message must be a string ';
          errMsg += 'msgSeverity must be a number between 0 and 7';
          expect(reson.message).toBe(errMsg);
          done();
        });
  });
  test('RFC3164 Send with a bad port number ERROR', (done) => {
    let rfc3164 = new SyslogPro.RFC3164({
      colors: {
          emergencyColor: 30,
          alertColor: 30,
          criticalColor: 30,
          errorColor: 30,
          warningColor:30,
          noticeColor: 30,
          informationalColor: 30,
          debugColor: 30
      },
      server: {
        target: '127.0.0.1',
        port: global.tcpServerPort+100,
        protocol: 'tcp'
      }
    });
    expect.assertions(1);
    rfc3164.send('hello')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errMsg = 'connect ECONNREFUSED 127.0.0.1:8101';
          expect(reson.message).toBe(errMsg);
          done();
        });
  });
  test('RFC3164 SetColors', (done) => {
    expect.assertions(1);
    let rfc3164 = new SyslogPro.RFC3164();
    rfc3164.setColor({
          emergencyColor: 30,
          alertColor: 30,
          criticalColor: 30,
          errorColor: 30,
          warningColor:30,
          noticeColor: 30,
          informationalColor: 30,
          debugColor: 30
      },
      false)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RFC3164 SetColors with color type ERROR', (done) => {
    expect.assertions(8);
    let rfc3164 = new SyslogPro.RFC3164();
    rfc3164.setColor({
      emergencyColor: {}
    }, false)
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: ';
          errorMsg += 'emergencyColor';
          errorMsg += ' Not in RGB color hex or color code';
          expect(reson.message).toBe(errorMsg);
          rfc3164.setColor({
            alertColor: {}
          }, false)
              .then((result) => {
                console.log(result);
              })
              .catch((reson) => {
                let errorMsg = 'TYPE ERROR: ';
                errorMsg += 'alertColor';
                errorMsg += ' Not in RGB color hex or color code';
                expect(reson.message).toBe(errorMsg);
                rfc3164.setColor({
                  criticalColor: {}
                }, false)
                    .then((result) => {
                      console.log(result);
                    })
                    .catch((reson) => {
                      let errorMsg = 'TYPE ERROR: ';
                      errorMsg += 'criticalColor';
                      errorMsg += ' Not in RGB color hex or color code';
                      expect(reson.message).toBe(errorMsg);
                      rfc3164.setColor({
                        errorColor: {}
                      }, false)
                          .then((result) => {
                            console.log(result);
                          })
                          .catch((reson) => {
                            let errorMsg = 'TYPE ERROR: ';
                            errorMsg += 'errorColor';
                            errorMsg += ' Not in RGB color hex or color code';
                            expect(reson.message).toBe(errorMsg);
                            rfc3164.setColor({
                              warningColor: {}
                            }, false)
                                .then((result) => {
                                  console.log(result);
                                })
                                .catch((reson) => {
                                  let errorMsg = 'TYPE ERROR: ';
                                  errorMsg += 'warningColor';
                                  errorMsg += ' Not in RGB color hex or color code';
                                  expect(reson.message).toBe(errorMsg);
                                  rfc3164.setColor({
                                    noticeColor: {}
                                  }, false)
                                      .then((result) => {
                                        console.log(result);
                                      })
                                      .catch((reson) => {
                                        let errorMsg = 'TYPE ERROR: ';
                                        errorMsg += 'noticeColor';
                                        errorMsg += ' Not in RGB color hex or color code';
                                        expect(reson.message).toBe(errorMsg);
                                        rfc3164.setColor({
                                          informationalColor: {}
                                        }, false)
                                            .then((result) => {
                                              console.log(result);
                                            })
                                            .catch((reson) => {
                                              let errorMsg = 'TYPE ERROR: ';
                                              errorMsg += 'informationalColor';
                                              errorMsg += ' Not in RGB color hex or color code';
                                              expect(reson.message).toBe(errorMsg);
                                              rfc3164.setColor({
                                                debugColor: {}
                                              }, false)
                                                  .then((result) => {
                                                    console.log(result);
                                                  })
                                                  .catch((reson) => {
                                                    let errorMsg = 'TYPE ERROR: ';
                                                    errorMsg += 'debugColor';
                                                    errorMsg += ' Not in RGB color hex or color code';
                                                    expect(reson.message).toBe(errorMsg);
                                                    done();
                                                  });
                                            });
                                      });
                                });
                          });
                    });
              });
        });
  });
  test('RFC3164 buildMessage color options', (done) => {
    expect.assertions(3);
    let rfc3164 = new SyslogPro.RFC3164({
      color: true,
      extendedColor: true
    });
    rfc3164.buildMessage('test', {
      msgColor: 30
    })
        .then((result) => {
          expect(result).toMatch(/<190>(J|F|M|A|S|O|N|D).+(\u001b\[38;5;30mtest\u001b\[0m\n)/);
          rfc3164.extendedColor = false;
          rfc3164.buildMessage('test', {
            msgColor: {}
          })
              .then((result) => {
                expect(result).toMatch(/<190>(J|F|M|A|S|O|N|D).+(\u001b\[39mtest\u001b\[0m\n)/);
                rfc3164.buildMessage('test', {
                })
                    .then((result) => {
                      expect(result).toMatch(/<190>(J|F|M|A|S|O|N|D).+(\u001b\[36mtest\u001b\[0m\n)/);
                      done();
                    })
                    .catch((reson) => {
                      console.log(reson);
                    });
              })
              .catch((reson) => {
                console.log(reson);
              });
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
});

// Base Syslog Class Test
describe('Base Syslog Class tests', () => {
  test('Syslog Send UDP with DNS Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      target: 'noteareal.dns',
      protocol: 'udp',
      port: global.udpServerPort
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          expect(reson.message).toBe('getaddrinfo ENOTFOUND noteareal.dns');
          done();
        });
  });  
  test('Syslog Send UDP with bad message type Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      target: 'noteareal.dns',
      protocol: 'udp',
      port: global.udpServerPort
    });
    expect.assertions(1);
    syslog.send({})
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: Syslog message must be a string';
          expect(reson.message).toBe(errorMsg);
          done();
        });
  });
  test('Syslog Send UDP with IPv6 target', (done) => {
    let syslog = new SyslogPro.Syslog({
      target: '127.0.0.1',
      protocol: 'udp',
      port: global.udpServerPort
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          expect(result).toBe('test');
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('Syslog Send TLS with timeout Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: ['./tests/jest_test_server_cert.pem'],
      tcpTimeout: 1
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TIMEOUT ERROR: Syslog server TLS timeout';
          expect(reson.message).toBe(errorMsg);
          done();
        });    
  });
  test('Syslog Send TLS with server cert location type Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: [{}],
      tcpTimeout: 1
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: TLS Server Cert is not a file';
          errorMsg += 'location string';
          expect(reson.message).toBe(errorMsg);
          done();
        });    
  });
  test('Syslog Send TLS with client cert location type Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: './tests/jest_test_server_cert.pem',
      tlsClientCert: {},
      tlsClientKey: './tests/jest_test_client_key.pem',
      tcpTimeout: 1
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: TLS Client Cert is not a file';
          errorMsg += 'location string';
          expect(reson.message).toBe(errorMsg);
          done();
        });    
  });
  test('Syslog Send TLS with client key location type Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: ['./tests/jest_test_server_cert.pem'],
      tlsClientCert: './tests/jest_test_client_cert.pem',
      tlsClientKey: {},
      tcpTimeout: 1
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: TLS Client Key is not a file';
          errorMsg += 'location string';
          expect(reson.message).toBe(errorMsg);
          done();
        });    
  });
  test('Syslog Send TLS with no server certs', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: 443,
      target: 'cloud.positon.org',  // Public test server
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          expect(result).toBe('test');
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });    
  });
  test('Syslog Send TCP with DNS Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      target: 'noteareal.dns',
      protocol: 'tcp',
      port: global.tcpServerPort
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          expect(reson.message).toBe('getaddrinfo ENOTFOUND noteareal.dns');
          done();
        });
  });  
  test('Syslog Send TCP with timeout Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tcp',
      target: 'portquiz.net',  // Public test server
      tcpTimeout: 1
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TIMEOUT ERROR: Syslog server TCP timeout';
          expect(reson.message).toBe(errorMsg);
          done();
        });    
  });
  test('Syslog addTlsServerCerts server cert location type Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tcpTimeout: 1
    });
    expect.assertions(1);
    syslog.addTlsServerCerts(6)
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'TYPE ERROR: Server Cert file locations should be a';
          errorMsg += ' string or array of strings';
          expect(reson.message).toBe(errorMsg);
          done();
        });    
  });
  test('Syslog constructor with format cef but no object', (done) => {
    let syslog = new SyslogPro.Syslog({
      format: 'cef'
    });
    expect(syslog.cef.constructor__).toBe(true);
    done();
  });
  test('Syslog constructor with format leef but no object', (done) => {
    let syslog = new SyslogPro.Syslog({
      format: 'leef'
    });
    expect(syslog.leef.constructor__).toBe(true);
    done();
  });
  test('Syslog constructor with format rfc5424 but no object', (done) => {
    let syslog = new SyslogPro.Syslog({
      format: 'rfc5424'
    });
    expect(syslog.rfc5424.constructor__).toBe(true);
    done();
  });
  test('Syslog constructor with format rfc3164 but no object', (done) => {
    let syslog = new SyslogPro.Syslog({
      format: 'rfc3164'
    });
    expect(syslog.rfc3164.constructor__).toBe(true);
    done();
  });
  test('Syslog constructor with format objects', (done) => {
    let rfc3164 = new SyslogPro.RFC3164();
    let rfc5424 = new SyslogPro.RFC5424();
    let leef = new SyslogPro.LEEF();
    let cef = new SyslogPro.CEF();
    let syslog = new SyslogPro.Syslog({
      rfc3164: rfc3164,
      rfc5424: rfc5424,
      leef: leef,
      cef: cef,
    });
    expect.assertions(4);
    expect(syslog.rfc3164.constructor__).toBe(true);
    expect(syslog.rfc5424.constructor__).toBe(true);
    expect(syslog.leef.constructor__).toBe(true);
    expect(syslog.cef.constructor__).toBe(true);
    done();
  });
  test('Syslog constructor with format objects configs', (done) => {
    let rfc3164 = {};
    let rfc5424 = {};
    let leef = {};
    let cef = {};
    let syslog = new SyslogPro.Syslog({
      rfc3164: rfc3164,
      rfc5424: rfc5424,
      leef: leef,
      cef: cef,
    });
    expect.assertions(4);
    expect(syslog.rfc3164.constructor__).toBe(true);
    expect(syslog.rfc5424.constructor__).toBe(true);
    expect(syslog.leef.constructor__).toBe(true);
    expect(syslog.cef.constructor__).toBe(true);
    done();
  });
  test('Syslog Send with Protocol selection Error', (done) => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'bad'
    });
    expect.assertions(1);
    syslog.send('test')
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          let errorMsg = 'FORMAT ERROR: Protocol not recognized, should be ';
          errorMsg += 'udp|tcp|tls';
          expect(reson.message).toBe(errorMsg);
          done();
        });    
  });
});

// RGB to ANSI Color Function Test
describe('RGB to ANSI Color Function Tests', () => {
  test('RgbToAnsi Non Extended Colors hex v === 2', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi('#ffffff', false)
        .then((result) => {
          expect(result).toBe(90);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RgbToAnsi Non Extended Colors hex v === 0', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi('#000000', false)
        .then((result) => {
          expect(result).toBe(30);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RgbToAnsi Non Extended Colors hex v === 1', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi('#640000', false)
        .then((result) => {
          expect(result).toBe(30);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RegToAnsi Extended Colors #640000', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi('#640000', true)
        .then((result) => {
          expect(result).toBe(88);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RegToAnsi Extended Colors #050505', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi('#050505', true)
        .then((result) => {
          expect(result).toBe(16);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RegToAnsi Extended Colors #646464', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi('#646464', true)
        .then((result) => {
          expect(result).toBe(241);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RegToAnsi Extended Colors #f9f9f9', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi('#f9f9f9', true)
        .then((result) => {
          expect(result).toBe(231);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RegToAnsi Extended Colors 100', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi(100, true)
        .then((result) => {
          expect(result).toBe(100);
          done();
        })
        .catch((reson) => {
          console.log(reson);
        });
  });
  test('RegToAnsi Extended Colors 300 out of range Error', (done) => {
    expect.assertions(1);
    SyslogPro.RgbToAnsi(300, true)
        .then((result) => {
          console.log(result);
        })
        .catch((reson) => {
          expect(reson.message).toBe('FORMAT ERROR: Color code not in range');
          done();
        });
  });
});

/*global expect*/
/*global beforeAll*/
/*global afterAll*/ 