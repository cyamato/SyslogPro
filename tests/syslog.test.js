const Syslog = require("../syslog");
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
      console.log('UDP server running on', global.udpServerPort);
    });
    
    // Load a TCP server
    // global.tcpServerPort = 8001;
    this.tcpServer = net.createServer((socket) => {
      socket.on('data', function (data) {});
      socket.on('end', function () {});
    });
    this.tcpServer.listen(global.tcpServerPort, () => {
      console.log('TCP server running on', global.tcpServerPort);
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
      console.log('TLS basic server running on', global.tlsBasicServerPort);
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
      console.log('TLS auth server running on', global.tlsAuthServerPort);
    });
  });
}

function teardownServers() {
  return new Promise ((resolve, reject) => {
    this.udpServer.close(() => {console.log('UDP server closed')});
    this.tcpServer.close(() => {console.log('TCP server closed')});
    this.tlsBasicServer.close(() => {console.log('TLS basic server closed')});
    this.tlsAuthServer.close(() => {console.log('TLS auth server closed')});
  });
}

beforeAll(() => {
  setupServers().then((result => {}));
});

afterAll(() => {
  teardownServers().then((result => {}));
});
  
test('constructor', () => {
  let syslog = new Syslog.Syslog();
  expect(syslog).toEqual({
    format: 'none',
    rfc5424: {
      timestamp: true,
      timestampUTC: false,
      timestampTZ: true,
      utf8BOM: true,
      encludeStructuredData: false,
    },
    color: false,
    extendedColor: false,
    severity: 6,
    target: '127.0.0.1',
    protocol: 'udp',
    port: 514,
    tlsServerCerts: [],
    tcpTimeout: 10000,
    applacationName: 'NodeJSLogger',
    hostname: os.hostname(),
    facility: 23,
    rfc5424MsgId: '-',
    rfc5424StructuredData: [
      "[timeQuality tzKnown=1]"  
    ],
    emergencyColor: 31,
    alertColor: 31,
    criticalColor: 31,
    errorColor: 33,
    warningColor: 33,
    noticeColor: 36,
    informationalColor: 36,
    debugColor: 34 
  });
});

test('constructor with options', () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    tlsServerCerts: ['jest_test_server_cert.pem'],
    rfc5424: {
      timestamp: true,
      timestampUTC: true,
      timestampTZ: false,
      utf8BOM: false,
      encludeStructuredData: true
    },
    color: true,
    extendedColor: true
  });
  expect(syslog).toEqual({
    format: 'rfc5424',
    tlsServerCerts: ['jest_test_server_cert.pem'],
    rfc5424: {
      timestamp: true,
      timestampUTC: true,
      timestampTZ: false,
      utf8BOM: false,
      encludeStructuredData: true,
      msgId: '-',
      structuredData: []
    },
    color: true,
    extendedColor: true,
    severity: 6,
    target: '127.0.0.1',
    protocol: 'udp',
    port: 514,
    tcpTimeout: 10000,
    applacationName: 'NodeJSLogger',
    hostname: 'cyamato-kentik-play-6360226',
    facility: 23,
    emergencyColor: 1,
    alertColor: 202,
    criticalColor: 208,
    errorColor: 178,
    warningColor: 226,
    noticeColor: 117,
    informationalColor: 45,
    debugColor: 27 
  });
});

test('rgbToAnsi with color #010101', () => {
  let syslog = new Syslog.Syslog({extendedColor: true});
  expect.assertions(1);
  return syslog.rgbToAnsi('#010101').then((result) => {
    expect(result).toBe(16);
  });
});

test('rgbToAnsi with color #ffffff', () => {
  let syslog = new Syslog.Syslog({extendedColor: true});
  expect.assertions(1);
  return syslog.rgbToAnsi('#ffffff').then((result) => {
    expect(result).toBe(231);
  });
});

test('rgbToAnsi with extended color #160011', () => {
  let syslog = new Syslog.Syslog({extendedColor: true});
  expect.assertions(1);
  return syslog.rgbToAnsi('#161616').then((result) => {
    expect(result).toBe(233);
  });
});

test('rgbToAnsi with extended color #ff0011', () => {
  let syslog = new Syslog.Syslog({extendedColor: true});
  expect.assertions(1);
  return syslog.rgbToAnsi('#ff0011').then((result) => {
    expect(result).toBe(196);
  });
});

test('rgbToAnsi with color #000000', () => {
  let syslog = new Syslog.Syslog({
    extendedColor: false
  });
  expect.assertions(1);
  return syslog.rgbToAnsi('#000000').then((result) => {
    expect(result).toBe(30);
  });
});

test('rgbToAnsi with color #ffffff', () => {
  let syslog = new Syslog.Syslog({
    extendedColor: false
  });
  expect.assertions(1);
  return syslog.rgbToAnsi('#ffffff').then((result) => {
    expect(result).toBe(97);
  });
});

test('rgbToAnsi with extedned color 255', () => {
  let syslog = new Syslog.Syslog({extendedColor: true});
  expect.assertions(1);
  return syslog.rgbToAnsi(255).then((result) => {
    expect(result).toBe(255);
  });
});

test('rgbToAnsi with extedned color 255', () => {
  let syslog = new Syslog.Syslog({extendedColor: false});
  expect.assertions(1);
  return syslog.rgbToAnsi(95).then((result) => {
    expect(result).toBe(95);
  });
});

test('rgbToAnsi with bad input', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.rgbToAnsi('#TTTTTT'))
      .rejects
      .toHaveProperty('message', 'TYPE ERROR: Not in RGB color hex or color code');
      // .toThrow();
});

test('setColor with bad input severity = 9', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.setColor(9, 30))
      .rejects
      .toHaveProperty('message', 'FORMAT ERROR: Severity level not recognized');
});

test('setColor with bad input color = 1', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.setColor(0, 1))
      .rejects
      .toHaveProperty('message', 'FORMAT ERROR: Color code not in range');
});

test('setColors with an Array', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return syslog.setColors([
      {severity: 0, color: 32},
      {severity: 1, color: 32},
      {severity: 2, color: 32},
      {severity: 3, color: 32},
      {severity: 4, color: 32},
      {severity: 5, color: 32},
      {severity: 6, color: 32},
      {severity: 7, color: 32}
    ]).then((result) => {
    expect(result).toBeTruthy();
  });
});

test('setColors with bad input', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.setColors(''))
      .rejects
      .toHaveProperty('message', 'TYPE ERROR: colors is not an Array or Object');
});

test('setColors with bad severity object in Array', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.setColors([{severity:[], color:1}]))
      .rejects
      .toHaveProperty('message', 'TYPE ERROR: Severity is not reconized string or integer');
});

test('setColors with bad object in input Array', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.setColors([{color:1}]))
      .rejects
      .toHaveProperty('message', 'TYPE ERROR: The color object at index 0 is not of the correct format');
});

test('setColors with Object', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return syslog.setColors({severity: 0, color: 32}).then((result) => {
    expect(result).toBeTruthy();
  });
});

test('setColors with bad Object of wrong types', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.setColors({severity: [], color:1}))
      .rejects
      .toHaveProperty('message', 'TYPE ERROR: Severity is not reconized string or integer');
});

test('setColors with bad Object', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.setColors({color:1}))
      .rejects
      .toHaveProperty('message', 'TYPE ERROR: The color object is not of the correct format');
});

test('sending and Debug message over IPv6 (Localhost Must have IPv6)',  () => {
  const dnsOptions = {
    family: 6,
    verbatim: true
  };
  dnsPromises.lookup('localhost', dnsOptions)
      .then((result) => {
    let syslog = new Syslog.Syslog({
      format: 'rfc5424',
      target: result.address,
      protocol: 'udp',
      port: global.udpServerPort,
      rfc5424: {
        msgId: '1',
        timestamp: true,
        timestampUTC: true,
        timestampMS: true,
        timestampTZ: true,
        encludeStructuredData: true,
        utf8BOM: false
      }
    });
    // expect.assertions(1);
    return syslog.debug('TestMsg').then((result) => {
      expect(result).toMatch(/^<191>/);
    });
  });
});

test('sending and Debug message over IPv4 (Localhost Must have IPv4)',  () => {
  const dnsOptions = {
    family: 4,
    verbatim: true
  };
  dnsPromises.lookup('localhost', dnsOptions)
      .then((result) => {
    let syslog = new Syslog.Syslog({
      format: 'rfc5424',
      target: result.address,
      protocol: 'udp',
      port: global.udpServerPort,
      rfc5424: {
        msgId: '1',
        timestamp: true,
        timestampUTC: true,
        timestampMS: true,
        timestampTZ: true,
        encludeStructuredData: true,
        utf8BOM: false
      }
    });
    // expect.assertions(3);
    return syslog.debug('TestMsg').then((result) => {
      console.log('IPv4 Test');
      expect(result).toMatch(/^<191>/);
    });
  });
});

test('addTlsServerCerts with wrong input Type', () => {
  let syslog = new Syslog.Syslog({});
  expect.assertions(1);
  return expect(syslog.addTlsServerCerts(16))
      .rejects
      .toThrow();  
});

test('buildMessage with bad color type', () => {
  let syslog = new Syslog.Syslog({
    format: 'none',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    color: true,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: true
    }
  });
  expect.assertions(1);
  return syslog.buildMessage('TestMsg', {
    msgSeverity: 0,
    msgColor: []
  })
  .then((result) => {
    expect(result).toMatch(/TestMsg/);
  });  
});

test('sendMessage with bad input message type', () => {
  let syslog = new Syslog.Syslog({ 
        protocol: 'tcp',
        target: 'localhost',
        port: global.tcpServerPort,
        tcpTimeout: 1
      });
  expect.assertions(1);
  return expect(syslog.sendMessage([]))
      .rejects
      .toHaveProperty('message', 'TYPE ERROR: Syslog message must be a string');
});

test('process with bad timeout protocol="tcp"', () => {
  let syslog = new Syslog.Syslog({ 
        protocol: 'tcp',
        target: 'localhost',
        port: global.tcpServerPort,
        tcpTimeout: 1
      });
  expect.assertions(1);
  return expect(syslog.process('Hello', {
    msgSeverity: 0,
    msgColor: '#ffffff'
  }))
      .rejects
      .toHaveProperty('message', 'TIMEOUT ERROR: Syslog server TCP timeout');
});

test('process with bad IP Port protocol="tcp"', () => {
  let syslog = new Syslog.Syslog({ 
        protocol: 'tcp',
        target: 'localhost',
        port: global.tcpServerPort + 10,
        tcpTimeout: 1,
        extendedColor: false
      });
  return expect(syslog.process('Hello', {
    msgColor: 95,
    msgFacility: 23
  }))
      .rejects
      .toHaveProperty('message', 'TIMEOUT ERROR: Syslog server TCP timeout');
});

test('process with timeout protocol="tls"', () => {
  let syslog = new Syslog.Syslog({ 
        protocol: 'tls',
        target: 'localhost',
        port: global.tlsBasicServerPort,
        tcpTimeout: 1
      });
  return expect(syslog.process('Hello', {
    msgSeverity: 0, 
    msgColor:'#ffffff'
  }))
      .rejects
      .toHaveProperty('message', 'TIMEOUT ERROR: Syslog server TLS timeout');
});

test('emer sendMessage with bad input protocol', () => {
  let syslog = new Syslog.Syslog({
    protocol: 'icmp'
  });
  expect.assertions(1);
  return expect(syslog.emer('Hello'))
      .rejects
      .toHaveProperty('message', 'FORMAT ERROR: Protocol is not UDP|TCP|TLS');
});

test('sendMessage with bad input target="nowher.notafqdn"', () => {
  let syslog = new Syslog.Syslog({target: 'nowher.notafqdn'});
  return expect(syslog.sendMessage('Hello'))
      .rejects
      .toHaveProperty('message', 'getaddrinfo ENOTFOUND nowher.notafqdn');
});

test('Process a message with bad input msgSeverity=9', () => {
  let syslog = new Syslog.Syslog();
  expect.assertions(1);
  return expect(syslog.process('Hello', {
    msgSeverity: 9,
    msgColor: '#ffffff'
  }))
      .rejects
      .toHaveProperty('message', 'FORMAT ERROR: Syslog message must be a string msgSeverity must be a number between 0 and 7');
});

test('sendMessage with bad server cert location',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc3164',
    target: 'localhost',
    protocol: 'tls',
    port: global.tlsAuthServerPort,
    tlsClientCert: './tests/jest_test_client_cert.pem',
    tlsClientKey: './tests/jest_test_client_key.pem',
    tlsServerCerts: [['./tests/jest_test_server_cert.pem']],
  });
  expect.assertions(1);
  return expect(syslog.sendMessage('TestMsg'))
    .rejects
    .toHaveProperty('message', 'TYPE ERROR: TLS Server Cert is not a filelocation string');
});

test('sendMessage with bad client cert location',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc3164',
    target: 'localhost',
    protocol: 'tls',
    port: global.tlsAuthServerPort,
    tlsClientCert: ['./tests/jest_test_client_cert.pem'],
    tlsClientKey: './tests/jest_test_client_key.pem',
    tlsServerCerts: ['./tests/jest_test_server_cert.pem'],
  });
  expect.assertions(1);
  return expect(syslog.sendMessage('TestMsg'))
    .rejects
    .toHaveProperty('message', 'TYPE ERROR: TLS Client Cert is not a filelocation string');
});

test('sendMessage with bad client key location',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc3164',
    target: 'localhost',
    protocol: 'tls',
    port: global.tlsAuthServerPort,
    tlsClientCert: './tests/jest_test_client_cert.pem',
    tlsClientKey: ['./tests/jest_test_client_key.pem'],
    tlsServerCerts: ['./tests/jest_test_server_cert.pem'],
  });
  expect.assertions(1);
  return expect(syslog.sendMessage('TestMsg'))
    .rejects
    .toHaveProperty('message', 'TYPE ERROR: TLS Client Key is not a filelocation string');
});

test('sending a Emergency message',  () => {
  let syslog = new Syslog.Syslog({
    protocol: 'tls',
    target: 'localhost',
    port: global.tlsBasicServerPort,
    format: 'rfc5424',
    tlsServerCerts: ['./tests/jest_test_server_cert.pem'],
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: false,
      timestampMS: false,
      timestampTZ: false,
      encludeStructuredData: true,
      utf8BOM: true
    }
  });
  return syslog.emergency('TestMsg').then((result) => {
    expect(result).toMatch(/^<184>.* BOMTestMsg\n/);
  });
});

test('sending a Emer message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'tcp',
    port: global.tcpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: false,
      timestampMS: true,
      timestampTZ: false,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.emer('TestMsg').then((result) => {
    expect(result).toMatch(/^<184>/);
  });
});

test('sending a Alert message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: false,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.alert('TestMsg').then((result) => {
    expect(result).toMatch(/^<185>/);
  });
});

test('sending a Critical message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: false,
      timestampTZ: false,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.critical('TestMsg').then((result) => {
    expect(result).toMatch(/^<186>/);
  });
});

test('sending a Crit message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'tls',
    port: global.tlsBasicServerPort,
    tlsServerCerts: './tests/jest_test_server_cert.pem',
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: false,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.crit('TestMsg').then((result) => {
    expect(result).toMatch(/^<186>/);
  });
});

test('sending a Error message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: false,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.error('TestMsg').then((result) => {
    expect(result).toMatch(/^<187>/);
  });
});

test('sending a err message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.err('TestMsg').then((result) => {
    expect(result).toMatch(/^<187>/);
  });
});

test('sending a Warning message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: false,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      structuredData: [
        '[something@6545423 value=this]',
        '[something@6545423 value=this2]'
      ],
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.warning('TestMsg').then((result) => {
    expect(result).toMatch(/^<188>/);
  });
});

test('sending a Warn message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.warn('TestMsg').then((result) => {
    expect(result).toMatch(/^<188>/);
  });
});

test('sending a Notice message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: false,
      timestampMS: false,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.notice('TestMsg').then((result) => {
    expect(result).toMatch(/^<189>/);
  });
});

test('sending a Note message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    color: true,
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: false,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.note('TestMsg').then((result) => {
    expect(result).toMatch(/^<189>/);
  });
});

test('sending a Informational message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc3164',
    target: 'localhost',
    protocol: 'tls',
    port: global.tlsAuthServerPort,
    tlsClientCert: './tests/jest_test_client_cert.pem',
    tlsClientKey: './tests/jest_test_client_key.pem',
    tlsServerCerts: ['./tests/jest_test_server_cert.pem'],
    colors: [
      {severity: 0, color: 32},
      {severity: 1, color: 32},
      {severity: 2, color: 32},
      {severity: 3, color: 32},
      {severity: 4, color: 32},
      {severity: 5, color: 32},
      {severity: 6, color: 32},
      {severity: 7, color: 32}
    ],
    severity: 0,
    rfc5424: {
      msgId: '1',
      timestamp: false,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.informational('TestMsg').then((result) => {
    expect(result).toMatch(/^<190>/);
  });
});

test('sending a Info message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'none',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    color: true,
    extendedColor: true,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.info('TestMsg').then((result) => {
    expect(result).toMatch(/TestMsg/);
  });
});

test('sending a Log message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.log('TestMsg').then((result) => {
    expect(result).toMatch(/^<190>/);
  });
});

test('sending a Debug message',  () => {
  let syslog = new Syslog.Syslog({
    format: 'rfc5424',
    target: 'localhost',
    protocol: 'udp',
    port: global.udpServerPort,
    rfc5424: {
      msgId: '1',
      timestamp: true,
      timestampUTC: true,
      timestampMS: true,
      timestampTZ: true,
      encludeStructuredData: true,
      utf8BOM: false
    }
  });
  expect.assertions(1);
  return syslog.debug('TestMsg').then((result) => {
    expect(result).toMatch(/^<191>/);
  });
});

test('buildMessage for a CEF message', () => {
  let cef = new Syslog.CEF();
  cef.extensions.deviceAction = 'test';
  cef.extensions.deviceCustomIPv6Address1 = 'sad';
  cef.extensions.myNewOne ='hello';
  expect.assertions(1);
  let syslog = new Syslog.Syslog({
    format: 'cef',
    cef: cef
  });
  // console.log(syslog);
  return syslog.buildMessage()
      .then((result) => {
        expect(result).toBe('CEF:0|Unknown|Unknown|Unknown|Unknown|Unknown|Unknown|deviceAction=test deviceCustomIPv6Address1=sad myNewOne=hello ');
      });
});

test('buildMessage for a LEEF message', () => {
  let leef = new Syslog.LEEF({
    syslogHeader: false
  });
  leef.attrabutes.cat = 'test';
  expect.assertions(1);
  let syslog = new Syslog.Syslog({
    format: 'leef',
    leef: leef
  });
  // console.log(syslog);
  return syslog.buildMessage('', {msgFormat:'leef'})
      .then((result) => {
        expect(result).toBe('LEEF:2.0|unknown|unknown|unknown|unknown|cat=test\t');
      });
});

test('buildMessage for a LEEF mesage with Syslog header', () => {
  let leef = new Syslog.LEEF({
    syslogHeader: true
  });
  leef.attrabutes.cat = 'test';
  expect.assertions(1);
  let syslog = new Syslog.Syslog({
    format: 'leef',
    leef: leef
  });
  // console.log(syslog);
  return syslog.buildMessage()
      .then((result) => {
        expect(result).toBe('LEEF:2.0|unknown|unknown|unknown|unknown|cat=test\t');
      });
});

test('constructor for a LEEF class object', () => {
  let leef = new Syslog.LEEF();
  expect(leef).toEqual({
    "eventId": "unknown", 
    "product": "unknown", 
    "vendor": "unknown", 
    "version": "unknown",
    "syslogHeader": true,
    "attrabutes": {
      "AttributeLimits": null, 
      "accountName": null, 
      "calCountryOrRegion": null, 
      "calLanguage": null, 
      "cat": null, 
      "devTime": null, 
      "devTimeFormat": null, 
      "domain": null, 
      "dst": null, 
      "dstBytes": null, 
      "dstMAC": null, 
      "dstPackets": null, 
      "dstPort": null, 
      "dstPostNAT": null, 
      "dstPostNATPort": null, 
      "dstPreNAT": null, 
      "dstPreNATPort": null, 
      "groupID": null, 
      "identGrpName": null, 
      "identHostName": null, 
      "identMAC": null, 
      "identNetBios": null, 
      "identSecondlp": null, 
      "identSrc": null, 
      "isLoginEvent": null, 
      "isLogoutEvent": null, 
      "policy": null, 
      "proto": null, 
      "realm": null, 
      "resource": null, 
      "role": null, 
      "sev": null, 
      "src": null, 
      "srcBytes": null, 
      "srcMAC": null, 
      "srcPackets": null, 
      "srcPort": null, 
      "srcPostNAT": null, 
      "srcPostNATPort": null, 
      "srcPreNAT": null, 
      "srcPreNATPort": null, 
      "totalPackets": null, 
      "url": null, 
      "usrName": null, 
      "vSrc": null, 
      "vSrcName": null}
  });
});

test('sendMessage a LEEF message', () => {
  let leef = new Syslog.LEEF({
    syslogHeader: false
  });
  leef.attrabutes.cat = 'test';
  expect.assertions(1);
  return leef.sendMessage()
      .then((result) => {
        expect(result).toBe('LEEF:2.0|unknown|unknown|unknown|unknown|cat=test\t');
      });
});

test('sendMessage a LEEF with bad input target="nowher.notafqdn"', () => {
  let leef = new Syslog.LEEF();
  return expect(leef.sendMessage({target: 'nowher.notafqdn'}))
      .rejects
      .toHaveProperty('message', 'getaddrinfo ENOTFOUND nowher.notafqdn');
});

test('validate a CEF message with a bad device info', () => {
  let cef = new Syslog.CEF();
  cef.deviceVendor = 1;
  cef.deviceProduct = 1;
  cef.deviceVersion = 1;
  expect.assertions(1);
  return expect(cef.validate())
    .rejects
    .toHaveProperty('message', 'TYPE ERROR: CEF Device Info must be a string');
});

test('validate a CEF message with a bad severity number level', () => {
  let cef = new Syslog.CEF({
    deviceVendor: 'test',
    severity: 11,
    extensions: {
      deviceAction:'test',
      myNewOne:'hello',
      deviceCustomIPv6Address1:'sad'
    }
  });
  expect.assertions(1);
  return expect(cef.validate())
    .rejects
    .toHaveProperty('message', 'TYPE ERROR: CEF Severity not set correctly');
});

test('validate a CEF message with a bad severity string level', () => {
  let cef = new Syslog.CEF();
  cef.severity = 'Craig';
  expect.assertions(1);
  return expect(cef.validate())
    .rejects
    .toHaveProperty('message', 'TYPE ERROR: CEF Severity not set correctly');
});

test('validate a CEF message with a bad extension length', () => {
  let cef = new Syslog.CEF();
  let toLong = 'abcdefghijklmopqrustwxyz';
  toLong += toLong;
  toLong += toLong;
  toLong += toLong;
  cef.extensions.deviceAction = toLong;
  expect.assertions(1);
  return expect(cef.validate())
    .rejects
    .toHaveProperty('message', 'FORMAT ERROR: CEF Extention Key deviceAction value length is to long; max length is 63');
});

test('validate a CEF message with a bad extension type', () => {
  let cef = new Syslog.CEF();
  cef.extensions.deviceAction = [];
  expect.assertions(1);
  return expect(cef.validate())
    .rejects
    .toHaveProperty('message', 'TYPE ERROR: CEF Key deviceAction value type was expected to be string');
});

test('validate a CEF message', () => {
  let cef = new Syslog.CEF({
    extensions:{
      deviceAction:'test',
      myNewOne:'hello',
      deviceCustomIPv6Address1:'sad'
    }
  });
  expect.assertions(1);
  return cef.validate()
      .then((result) => {
        expect(result).toBeTruthy();
      });
});

test('sendMessage a CEF message', () => {
  let cef = new Syslog.CEF();
  cef.extensions.deviceAction = 'test';
  expect.assertions(1);
  return cef.sendMessage()
      .then((result) => {
        expect(result).toBe('CEF:0|Unknown|Unknown|Unknown|Unknown|Unknown|Unknown|deviceAction=test ');
      });
});

test('sendMessage a CEF with bad input target="nowher.notafqdn"', () => {
  let cef = new Syslog.CEF();
  return expect(cef.sendMessage({target: 'nowher.notafqdn'}))
      .rejects
      .toHaveProperty('message', 'getaddrinfo ENOTFOUND nowher.notafqdn');
});

/*global expect*/
/*global beforeAll*/
/*global afterAll*/