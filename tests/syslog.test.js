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
  test('CEF Validate with bad extension type ERROR', () => {
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
    try {
      cef.validate({});
    } catch (reason) {
      let errorMsg = 'TYPE ERROR: CEF Key deviceAction value type was '; 
      errorMsg += 'expected to be string';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('CEF Validate with bad extension value length ERROR', () => {
    let cef = new SyslogPro.CEF({
      extensions: {
        myNewExt: 'test',
        applicationProtocol: '1234567890abcdefghijklmnopqrustwxyz'
      },
      severity: 6
    });
    expect.assertions(1);
    try {
      cef.validate({});
    } catch(reason) {
      let errorMsg = 'FORMAT ERROR: CEF Extention Key applicationProtocol '; 
      errorMsg += 'value length is to long; max length is 31';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('CEF Validate with bad Severity ERROR', () => {
    let cef = new SyslogPro.CEF();
    cef.severity = 'BAD';
    expect.assertions(1);
    try {
      cef.validate();
    } catch(reason) {
      let errMsg = 'TYPE ERROR: CEF Severity not set correctly';
      expect(reason.message).toBe(errMsg);
    }
  });
  test('CEF Validate with bad device information ERROR', () => {
    let cef = new SyslogPro.CEF();
    cef.deviceProduct = {};
    expect.assertions(1);
    try {
      cef.validate();
    } catch(reason) {
      let errMsg = 'TYPE ERROR: CEF Device Info must be a string';
      expect(reason.message).toBe(errMsg);
    }
  });
  test('CEF Validate and Send A UDP Message to ::1', async () => {
    let cef = new SyslogPro.CEF(
      {
        extensions: {
          deviceAction: 'block'
        }
      }
    );
    let result = cef.validate();
    result = await cef.send({
      target: '::1',
      port:global.udpServerPort
    });
    let validateMsg = 'CEF:0|Unknown|Unknown|Unknown|Unknown|Unknown';
    validateMsg += '|Unknown|deviceAction=block ';
    expect(result).toBe(validateMsg);
  });
  test('CEF Send over TCP with bad port ERROR', async () => {
    let syslog = new SyslogPro.Syslog({
      target: '127.0.0.1',
      port: global.tcpServerPort+100,
      protocol: 'tcp'
    });
    let cef = new SyslogPro.CEF({
      server: syslog
    });
    expect.assertions(1);
    try {
      await cef.send({});
    } catch (reason) {
      expect(reason.message).toBe('connect ECONNREFUSED 127.0.0.1:8101');
    }
  });
});

// LEEF Class Test
describe('LEEF Class Tests', () => {
  test('LEEF Send over TLS with bad port ERROR', async () => {
    let syslog = new SyslogPro.Syslog({
      port: global.tlsBasicServerPort+100,
      protocol: 'tls',
      tlsServerCerts: [fs.readFileSync('./tests/jest_test_server_cert.pem')]
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
    try {
      await leef.send();
    } catch(reason) {
      expect(reason.message).toBe('connect ECONNREFUSED 127.0.0.1:8102');
    }
  });
  test('LEEF Send', async () => {
    let leef = new SyslogPro.LEEF();
    const result = await leef.send();
    expect(result).toBe('LEEF:2.0|unknown|unknown|unknown|unknown|');
  });
  test('LEEF Send with Auth TLS options', async () => {
    let syslogOptions = {
      port: global.tlsAuthServerPort,
      protocol: 'tls',
      tlsServerCerts: [fs.readFileSync('./tests/jest_test_server_cert.pem')],
      tlsClientCert: fs.readFileSync('./tests/jest_test_client_cert.pem'),
      tlsClientKey: fs.readFileSync('./tests/jest_test_client_key.pem'),
    };
    let leef = new SyslogPro.LEEF({
      server: syslogOptions
    });
    expect.assertions(1);
    const result = await leef.send();
    expect(result).toBe('LEEF:2.0|unknown|unknown|unknown|unknown|');
  });
});

// RFC5424 Class Test
describe('RFC5424 Class Tests', () => {
  test('RFC5424 Sending critical - debug Severity Messages', async () => {
    let rfc5424 = new SyslogPro.RFC5424();
    let result = await rfc5424.debug('test')
    expect(result).toMatch(/<191>1 /);
    result = await rfc5424.log('test');
    expect(result).toMatch(/<190>1 /);
    result = await rfc5424.info('test');
    expect(result).toMatch(/<190>1 /);
    result = await rfc5424.note('test');
    expect(result).toMatch(/<189>1 /);
    result = await rfc5424.warn('test');
    expect(result).toMatch(/<188>1 /);
    result = await rfc5424.err('test');
    expect(result).toMatch(/<187>1 /);
    result = await rfc5424.crit('test');
    expect(result).toMatch(/<186>1 /);
  });
  test('RFC5424 Sending emergency - alert Severity Messages', async () => {
    let syslog = new SyslogPro.Syslog();
    let rfc5424 = new SyslogPro.RFC5424({
      server: syslog
    });
    expect.assertions(2);
    let result = await rfc5424.alert('test')
    expect(result).toMatch(/<185>1 /);
    result = await rfc5424.emer('test')
    expect(result).toMatch(/<184>1 /);
  });
  test('RFC5424 Send with a bad message type ERROR', async () => {
    let rfc5424 = new SyslogPro.RFC5424();
    expect.assertions(1);
    try {
      await rfc5424.send([]);
    } catch(reason) {
      let errMsg = 'FORMAT ERROR: Syslog message must be a string ';
      errMsg += 'msgSeverity must be a number between 0 and 7';
      expect(reason.message).toBe(errMsg);
    }
  });
  test('RFC5424 Send with a bad port number ERROR', async () => {
    let rfc5424 = new SyslogPro.RFC5424({
      utf8BOM: false,
      timestampUTC: true,
      timestampTZ: false,
      timestampMS: true,
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
    try {
      await rfc5424.send('hello');
    } catch(reason) {
      let errMsg = 'connect ECONNREFUSED 127.0.0.1:8101';
      expect(reason.message).toBe(errMsg);
    }
  });
  test('RFC5424 BuildMessage with Timestamp options', () => {
    let rfc5424 = new SyslogPro.RFC5424({
      color: true,
      timestamp: false,
      timestampUTC: false,
      timestampTZ: false,
      timestampMS: false,
    });
    let result = rfc5424.buildMessage('hello');
    expect(result).toMatch(/<190>1 - /);
    rfc5424 = new SyslogPro.RFC5424({
      color: true,
      extendedColor: true,
      timestamp: true,
      timestampUTC: false,
      timestampTZ: false,
      timestampMS: false,
    });
    result = rfc5424.buildMessage('hello',{
      msgColor: 50
    })
    let resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} /;
    expect(result).toMatch(resultMsg);
    rfc5424 = new SyslogPro.RFC5424({
      color: true,
      extendedColor: false,
      timestamp: true,
      timestampUTC: false,
      timestampTZ: false,
      timestampMS: true,
    });
    result = rfc5424.buildMessage('hello', {
      msgColor: 30,
      msgStructuredData: [
        '[ourSDID@32473 test=test]',
        '[ourSDID@32473 test=test]'
      ]
    });
    resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{1,3} /;
    expect(result).toMatch(resultMsg);
    rfc5424 = new SyslogPro.RFC5424({
      timestamp: true,
      timestampUTC: false,
      timestampTZ: true,
      timestampMS: true,
    });
    result = rfc5424.buildMessage('hello');
    resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{1,3}\+/;
    expect(result).toMatch(resultMsg);
    rfc5424 = new SyslogPro.RFC5424({
      timestamp: true,
      timestampUTC: false,
      timestampTZ: true,
      timestampMS: false,
    });
    result = rfc5424.buildMessage('hello');
    resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+/;
    expect(result).toMatch(resultMsg);
    rfc5424 = new SyslogPro.RFC5424({
      timestamp: true,
      timestampUTC: true,
      timestampTZ: false,
      timestampMS: false,
    });
    result = rfc5424.buildMessage('hello');
    resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} /;
    expect(result).toMatch(resultMsg);
    rfc5424 = new SyslogPro.RFC5424({
      timestamp: true,
      timestampUTC: true,
      timestampTZ: false,
      timestampMS: true,
    });
    result = rfc5424.buildMessage('hello');
    resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{1,3} /;
    expect(result).toMatch(resultMsg);
    rfc5424 = new SyslogPro.RFC5424({
      timestamp: true,
      timestampUTC: true,
      timestampTZ: true,
      timestampMS: true,
    });
    result = rfc5424.buildMessage('hello');
    resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{1,3}\+/;
    expect(result).toMatch(resultMsg);
    rfc5424 = new SyslogPro.RFC5424({
      timestamp: true,
      timestampUTC: true,
      timestampTZ: true,
      timestampMS: false,
    });
    result = rfc5424.buildMessage('hello');
    resultMsg = /<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+/;
    expect(result).toMatch(resultMsg);
  });
  test('RFC5424 BuildMessage with Timestamp options to set date', () => {
    const rfc5424 = new SyslogPro.RFC5424({
      color: true,
      timestampUTC: true,
      timestampTZ: true,
      timestampMS: true,
    });
    const timestamp = new Date('2020-01-01T01:23:45.678Z');
    const result = rfc5424.buildMessage('hello', { timestamp });
    expect(result.startsWith('<190>1 2020-01-01T01:23:45.678+00:00 ')).toBe(true);
  });
  test('RFC5424 BuildMessage with hostname and applicationName options', () => {
    const rfc5424 = new SyslogPro.RFC5424();
    const result = rfc5424.buildMessage('hello', {
      hostname: 'hostname',
      applicationName: 'applicationName'
    });
    expect(result).toMatch(/^<190>1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}[\+\-]\d{2}:\d{2} hostname applicationName - - - BOMhello\n$/);
  });
  test('RFC5424 SetColors', () => {
    let rfc5424 = new SyslogPro.RFC5424();
    const result = rfc5424.setColor({
          emergencyColor: 30,
          alertColor: 30,
          criticalColor: 30,
          errorColor: 30,
          warningColor:30,
          noticeColor: 30,
          informationalColor: 30,
          debugColor: 30
      },
      false);
    expect(result).toBe(true);
  });
  test('RFC5424 SetColors with color type ERROR', () => {
    expect.assertions(8);
    let rfc5424 = new SyslogPro.RFC5424();
    try {
      rfc5424.setColor({
        emergencyColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'emergencyColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc5424.setColor({
        alertColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'alertColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc5424.setColor({
        criticalColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'criticalColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc5424.setColor({
        errorColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'errorColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc5424.setColor({
        warningColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'warningColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc5424.setColor({
        noticeColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'noticeColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc5424.setColor({
        informationalColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'informationalColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc5424.setColor({
        debugColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'debugColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('RFC5424 buildMessage color options', () => {
    let rfc5424 = new SyslogPro.RFC5424({
      color: true,
      extendedColor: true
    });
    let result = rfc5424.buildMessage('test', {
      msgColor: 30
    })
    expect(result).toMatch(/<190>1 .+(\u001b\[38;5;30mtest\u001b\[0m\n)/);
    rfc5424.extendedColor = false;
    result = rfc5424.buildMessage('test', {
      msgColor: {}
    });
    expect(result).toMatch(/<190>1 .+(\u001b\[39mtest\u001b\[0m\n)/);
  });
});

// RFC3164 Class Test
describe('RFC3164 Class Tests', () => {
  test('RFC3164 Sending critical - debug Severity Messages', async () => {
    let rfc3164 = new SyslogPro.RFC3164();
    expect.assertions(7);
    let result = await rfc3164.debug('test');
    expect(result).toMatch(/<191>J|F|M|A|S|O|N|D/);
    result = await rfc3164.log('test');
    expect(result).toMatch(/<190>J|F|M|A|S|O|N|D/);
    result = await rfc3164.info('test');
    expect(result).toMatch(/<190>J|F|M|A|S|O|N|D/);
    result = await rfc3164.note('test');
    expect(result).toMatch(/<189>J|F|M|A|S|O|N|D/);
    result = await rfc3164.warn('test');
    expect(result).toMatch(/<188>J|F|M|A|S|O|N|D/);
    result = await rfc3164.err('test');
    expect(result).toMatch(/<187>J|F|M|A|S|O|N|D/);
    result = await rfc3164.crit('test')
    expect(result).toMatch(/<186>J|F|M|A|S|O|N|D/);
  });
  test('RFC3164 Sending TCP emergency - alert Severity Messages', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tcp',
      port: global.tcpServerPort
    });
    let rfc3164 = new SyslogPro.RFC3164({
      server: syslog
    });
    let result = await rfc3164.alert('test');
    expect(result).toMatch(/<185>J|F|M|A|S|O|N|D/);
    result = await rfc3164.emer('test');
    expect(result).toMatch(/<184>J|F|M|A|S|O|N|D/);
  });
  test('RFC3164 Send with a bad message type ERROR', async () => {
    let rfc3164 = new SyslogPro.RFC3164();
    expect.assertions(1);
    try {
      await rfc3164.send([]);
    } catch(reason) {
      let errMsg = 'FORMAT ERROR: Syslog message must be a string ';
      errMsg += 'msgSeverity must be a number between 0 and 7';
      expect(reason.message).toBe(errMsg);
    }
  });
  test('RFC3164 Send with a bad port number ERROR', async () => {
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
    try {
      await rfc3164.send('hello');
    } catch(reason) {
      let errMsg = 'connect ECONNREFUSED 127.0.0.1:8101';
      expect(reason.message).toBe(errMsg);
    }
  });
  test('RFC3164 SetColors', () => {
    let rfc3164 = new SyslogPro.RFC3164();
    const result = rfc3164.setColor({
        emergencyColor: 30,
        alertColor: 30,
        criticalColor: 30,
        errorColor: 30,
        warningColor:30,
        noticeColor: 30,
        informationalColor: 30,
        debugColor: 30
    },
    false);
    expect(result).toBe(true);
  });
  test('RFC3164 SetColors with color type ERROR', () => {
    expect.assertions(8);
    let rfc3164 = new SyslogPro.RFC3164();
    try {
      rfc3164.setColor({
        emergencyColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'emergencyColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc3164.setColor({
        alertColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'alertColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc3164.setColor({
        criticalColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'criticalColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc3164.setColor({
        errorColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'errorColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc3164.setColor({
        warningColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'warningColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc3164.setColor({
        noticeColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'noticeColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc3164.setColor({
        informationalColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'informationalColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
    try {
      rfc3164.setColor({
        debugColor: {}
      }, false);
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: ';
      errorMsg += 'debugColor';
      errorMsg += ' Not in RGB color hex or color code';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('RFC3164 buildMessage color options', () => {
    let rfc3164 = new SyslogPro.RFC3164({
      color: true,
      extendedColor: true
    });
    let result = rfc3164.buildMessage('test', {
      msgColor: 30
    });
    expect(result).toMatch(/<190>(J|F|M|A|S|O|N|D).+(\u001b\[38;5;30mtest\u001b\[0m\n)/);
    rfc3164.extendedColor = false;
    result = rfc3164.buildMessage('test', {
      msgColor: {}
    });
    expect(result).toMatch(/<190>(J|F|M|A|S|O|N|D).+(\u001b\[39mtest\u001b\[0m\n)/);
    result = rfc3164.buildMessage('test', {
    });
    expect(result).toMatch(/<190>(J|F|M|A|S|O|N|D).+(\u001b\[36mtest\u001b\[0m\n)/);
  });
  test('RFC3164 BuildMessage with Timestamp options to set date', () => {
    const rfc3164 = new SyslogPro.RFC3164();
    const timestamp = new Date(2020, 0, 1, 1, 23, 45);
    const result = rfc3164.buildMessage('hello', { timestamp });
    expect(result.startsWith('<190>Jan  1 01:23:45 ')).toBe(true);
  });
  test('RFC3164 BuildMessage with hostname and applicationName options', () => {
    const rfc3164 = new SyslogPro.RFC3164();
    const result = rfc3164.buildMessage('hello', {
      hostname: 'hostname',
      applicationName: 'applicationName'
    });
    expect(result).toMatch(/^<190>[A-Z][a-z]{2} [ \d]\d \d{2}:\d{2}:\d{2} hostname applicationName hello\n$/);
  });
});

// Base Syslog Class Test
describe('Base Syslog Class tests', () => {
  test('Syslog Send UDP with DNS Error', async () => {
    let syslog = new SyslogPro.Syslog({
      target: 'noteareal.dns',
      protocol: 'udp',
      port: global.udpServerPort
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      expect(reason.message).toBe('getaddrinfo ENOTFOUND noteareal.dns');
    }
  });
  test('Syslog Send UDP with bad message type Error', async () => {
    let syslog = new SyslogPro.Syslog({
      target: 'noteareal.dns',
      protocol: 'udp',
      port: global.udpServerPort
    });
    expect.assertions(1);
    try {
      await syslog.send({});
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: Syslog message must be a string';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('Syslog Send UDP with IPv6 target', async () => {
    let syslog = new SyslogPro.Syslog({
      target: '127.0.0.1',
      protocol: 'udp',
      port: global.udpServerPort
    });
    const result = await syslog.send('test');
    expect(result).toBe('test');
  });
  test('Syslog Send TLS with timeout Error', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: [fs.readFileSync('./tests/jest_test_server_cert.pem')],
      tcpTimeout: 1
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      let errorMsg = 'TIMEOUT ERROR: Syslog server TLS timeout';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('Syslog Send TLS with server cert type Error', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: [{}],
      tcpTimeout: 1
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: TLS Server Cert is not a valid type';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('Syslog Send TLS with client cert type Error', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: fs.readFileSync('./tests/jest_test_server_cert.pem'),
      tlsClientCert: {},
      tlsClientKey: fs.readFileSync('./tests/jest_test_client_key.pem'),
      tcpTimeout: 1
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: TLS Client Cert is not a valid type';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('Syslog Send TLS with client key type Error', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tlsServerCerts: [fs.readFileSync('./tests/jest_test_server_cert.pem')],
      tlsClientCert: fs.readFileSync('./tests/jest_test_client_cert.pem'),
      tlsClientKey: {},
      tcpTimeout: 1
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      let errorMsg = 'TYPE ERROR: TLS Client Key is not a valid type';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('Syslog Send TLS with no server certs', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: 443,
      target: 'cloud.positon.org',  // Public test server
    });
    const result = await syslog.send('test');
    expect(result).toBe('test');
  });
  test('Syslog Send TLS without rejectUnauthorized', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      rejectUnauthorized: false
    });
    const result = await syslog.send('test');
    expect(result).toBe('test');
  });
  test('Syslog Send TCP with DNS Error', async () => {
    let syslog = new SyslogPro.Syslog({
      target: 'noteareal.dns',
      protocol: 'tcp',
      port: global.tcpServerPort
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      expect(reason.message).toBe('getaddrinfo ENOTFOUND noteareal.dns');
    }
  });
  test('Syslog Send TCP with timeout Error', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tcp',
      target: 'portquiz.net',  // Public test server
      tcpTimeout: 1
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      let errorMsg = 'TIMEOUT ERROR: Syslog server TCP timeout';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('Syslog addTlsServerCerts server cert type Error', () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'tls',
      port: global.tlsBasicServerPort,
      tcpTimeout: 1
    });
    expect.assertions(1);
    try {
      syslog.addTlsServerCerts(6);
    } catch (reason) {
      let errorMsg = 'TYPE ERROR: Server Cert should be a';
      errorMsg += ' Buffer/string or array of Buffers/strings';
      expect(reason.message).toBe(errorMsg);
    }
  });
  test('Syslog constructor with format cef but no object', () => {
    let syslog = new SyslogPro.Syslog({
      format: 'cef'
    });
    expect(syslog.cef instanceof SyslogPro.CEF).toBe(true);
  });
  test('Syslog constructor with format leef but no object', () => {
    let syslog = new SyslogPro.Syslog({
      format: 'leef'
    });
    expect(syslog.leef instanceof SyslogPro.LEEF).toBe(true);
  });
  test('Syslog constructor with format rfc5424 but no object', () => {
    let syslog = new SyslogPro.Syslog({
      format: 'rfc5424'
    });
    expect(syslog.rfc5424 instanceof SyslogPro.RFC5424).toBe(true);
  });
  test('Syslog constructor with format rfc3164 but no object', () => {
    let syslog = new SyslogPro.Syslog({
      format: 'rfc3164'
    });
    expect(syslog.rfc3164 instanceof SyslogPro.RFC3164).toBe(true);
  });
  test('Syslog constructor with format objects', () => {
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
    expect(syslog.rfc3164 instanceof SyslogPro.RFC3164).toBe(true);
    expect(syslog.rfc5424 instanceof SyslogPro.RFC5424).toBe(true);
    expect(syslog.leef instanceof SyslogPro.LEEF).toBe(true);
    expect(syslog.cef instanceof SyslogPro.CEF).toBe(true);
  });
  test('Syslog constructor with format objects configs', () => {
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
    expect(syslog.rfc3164 instanceof SyslogPro.RFC3164).toBe(true);
    expect(syslog.rfc5424 instanceof SyslogPro.RFC5424).toBe(true);
    expect(syslog.leef instanceof SyslogPro.LEEF).toBe(true);
    expect(syslog.cef instanceof SyslogPro.CEF).toBe(true);
  });
  test('Syslog Send with Protocol selection Error', async () => {
    let syslog = new SyslogPro.Syslog({
      protocol: 'bad'
    });
    expect.assertions(1);
    try {
      await syslog.send('test');
    } catch(reason) {
      let errorMsg = 'FORMAT ERROR: Protocol not recognized, should be ';
      errorMsg += 'udp|tcp|tls';
      expect(reason.message).toBe(errorMsg);
    }
  });
});

// RGB to ANSI Color Function Test
describe('RGB to ANSI Color Function Tests', () => {
  test('RgbToAnsi Non Extended Colors hex v === 2', () => {
    const result = SyslogPro.RgbToAnsi('#ffffff', false);
    expect(result).toBe(90);
  });
  test('RgbToAnsi Non Extended Colors hex v === 0', () => {
    const result = SyslogPro.RgbToAnsi('#000000', false);
    expect(result).toBe(30);
  });
  test('RgbToAnsi Non Extended Colors hex v === 1', () => {
    const result = SyslogPro.RgbToAnsi('#640000', false);
    expect(result).toBe(30);
  });
  test('RegToAnsi Extended Colors #640000', () => {
    const result = SyslogPro.RgbToAnsi('#640000', true);
    expect(result).toBe(88);
  });
  test('RegToAnsi Extended Colors #050505', () => {
    const result = SyslogPro.RgbToAnsi('#050505', true);
    expect(result).toBe(16);
  });
  test('RegToAnsi Extended Colors #646464', () => {
    const result = SyslogPro.RgbToAnsi('#646464', true)
    expect(result).toBe(241);
  });
  test('RegToAnsi Extended Colors #f9f9f9', () => {
    const result = SyslogPro.RgbToAnsi('#f9f9f9', true);
    expect(result).toBe(231);
  });
  test('RegToAnsi Extended Colors 100', () => {
    const result = SyslogPro.RgbToAnsi(100, true);
    expect(result).toBe(100);
  });
  test('RegToAnsi Extended Colors 300 out of range Error', () => {
    expect.assertions(1);
    try {
      SyslogPro.RgbToAnsi(300, true);
    } catch(reason) {
      expect(reason.message).toBe('FORMAT ERROR: Color code not in range');
    }
  });
});

/*global expect*/
/*global beforeAll*/
/*global afterAll*/ 
