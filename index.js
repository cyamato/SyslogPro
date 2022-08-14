// INDEX.JS
/** Copyright (c) 2018 Craig Yamato */

/**
 * @fileoverview The SyslogPro module for sending syslog messages
 *
 * Syslog formatting classes can be used as input into a Syslog class to be used
 * simultaneously to the same Syslog server.  The Syslog Class with a configured
 * Syslog server target can also be used as the input into each of the
 * formatting classes so that they may run independently.
 * @author Craig Yamato <craig@kentik.com>
 * @copyright (c) 2018 - Craig Yamato
 * @version 0.1.0
 * @exports Syslog
 * @exports LEEF
 * @exports CEF
 * @module SyslogPro
 */
'use strict';
const moment = require('moment');
const os = require('os');
const dns = require('dns');
let dnsPromises = dns.promises;
const fs = require('fs');

/**
 * Format the ANSI foreground color code from a RGB hex code or ANSI color code
 * @private
 * @param {string|number} hex - The color hex code in the form of #FFFFFF or Number of
 *     the ANSI color code (30-37 Standard & 0-255 Extended)
 * @param {boolean} [extendedColor=false] - Whether to use ANSI extended color color codes.
 * @returns {number} - The formatted ANSI color code
 * @throws {Error} - A Format Error
 */
function rgbToAnsi(hex,
  extendedColor) {
  let colorCode = 0; // Var to hold color code
  // Break HEX Code up into RGB
  const hexParts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (hexParts || typeof hex === 'number') {
    if (typeof hex === 'number') {
      if (extendedColor && hex < 256) {
        return hex;
      } else if ((hex > 29 && hex < 38) || (hex > 89 && hex < 98)) {
        return hex;
      } else {
        throw new Error('FORMAT ERROR: Color code not in range');
      }
    } else {
      const r = parseInt(hexParts[1], 16);
      const g = parseInt(hexParts[2], 16);
      const b = parseInt(hexParts[3], 16);
      if (extendedColor) {
        if (r === g && g === b) {
          // Gray Scale Color
          if (r < 8) {
            colorCode = 16;
          } else if (r > 248) {
            colorCode = 231;
          } else {
            colorCode = Math.round(((r - 8) / 247) * 24) + 232;
          }
        } else {
          colorCode = 16
              + (36 * Math.round(r / 255 * 5))
              + (6 * Math.round(g / 255 * 5))
              + Math.round(b / 255 * 5);
        }
      } else {
        colorCode = 30;
        const red = r / 255;
        const green = g / 255;
        const blue = b / 255;
        let v = Math.max(red, green, blue) * 100;
        v = Math.round(v / 50);
        if (v === 1) {
          colorCode += ((Math.round(b / 255) << 2)
              | (Math.round(g / 255) << 1)
              | Math.round(r / 255));
        }
        if (v === 2) {
          colorCode += 60;
        }
      }
    }
    return colorCode;
  } else {
    throw new Error('TYPE ERROR: Not in RGB color hex or color code');
  }
}

/**
 * A class to work with syslog messages using UDP, TCP, or TLS transport.
 * There is support for Syslog message formatting RFC-3164, RFC-5424 including
 * Structured Data, IBM LEEF (Log Event Extended Format), and HP CEF (Common
 * Event Format).
 * Syslog formatting classes can be used as input into a Syslog class to be used
 * simultaneously to the same Syslog server. *
 * @requires moment
 * @version 0.0.0
 * @since 0.0.0
 */
class Syslog {
  /**
   * Construct a new Syslog transport object with user options
   * @public
   * @version 0.0.0
   * @since 0.0.0
   * @this Syslog
   * @param {object} [options] - Options object
   * >>>Transport Configuration
   * @param {string} [options.target='localhost'] - The IP Address|FQDN of the
   *    Syslog Server, this option if set will take precedence over any target
   *    set in a formatting object
   * @param {string} [options.protocol='udp'] - L4 transport protocol
   *    (udp|tcp|tls), this option if set will take precedence over any
   *    transport set in a formatting object
   * @param {number} [options.port=514] - IP port, this option if set will take
   *    precedence over any IP Port set in a formatting object
   * @param {number} [options.tcpTimeout=10000] - Ignored for all other
   *    transports, this option if set will take precedence over any timeout
   *    set in a formatting object
   * @param {string[]} [options.tlsServerCerts] - Array of authorized TLS server
   *    certificates file locations, this option if set will take precedence
   *    over any certificates set in a formatting object
   * @param {string} [options.tlsClientCert] - Client TLS certificate file
   *    location that this client should use, this option if set will take
   *    precedence over any certificates set in a formatting object
   * @param {string} [options.tlsClientKey] - Client TLS key file
   *    location that this client should use, this option if set will take
   *    precedence over any certificates set in a formatting object
   * >>>Syslog Format Settings
   * @param {string} [options.format='none'] - Valid syslog format options for
   *    this module are 'none', 'rfc3164', 'rfc5424', 'leef', 'cef'
   * @param {RFC3164} [options.rfc3164] - {@link module:SyslogPro~RFC3164|
   *    RFC3164 related settings}
   * @param {RFC5424} [options.rfc5424] - {@link module:SyslogPro~RFC5424|
   *    RFC5424 related settings}
   * @param {LEEF} [options.leef] - {@link module:SyslogPro~LEEF|IBM LEEF
   *    (Log Event Extended Format) object}
   * @param {CEF} [options.cef] - {@link module:SyslogPro~CEF|HP CEF
   *    (Common Event Format) formatting object}
   */
  constructor(options) {
    this.constructor__ = true;
    if (!options) {
      options = {};
    }
    // Basic transport setup
    /** @type {string} */
    this.target = options.target || 'localhost';
    /** @type {string} */
    this.protocol = options.protocol || 'udp';
    this.protocol = this.protocol.toLowerCase();
    /** @type {number} */
    this.port = options.port || 514;
    /** @type {number} */
    this.tcpTimeout = options.tcpTimeout || 10000;
    if ((typeof options.tlsServerCerts === 'object'
        && Array.isArray(options.tlsServerCerts))
        || typeof options.tlsServerCerts === 'string') {
      this.addTlsServerCerts(options.tlsServerCerts);
    } else {
      /** @type {string[]} */
      this.tlsServerCerts = [];
    }
    if (options.tlsClientCert) {
      /** @type {string} */
      this.tlsClientCert = options.tlsClientCert;
    }
    if (options.tlsClientKey) {
      /** @type {string} */
      this.tlsClientKey = options.tlsClientKey;
    }
    // Syslog Format
    if (typeof options.format === 'string') {
      /** @type {string} */
      this.format = options.format.toLowerCase();
    } else {
      this.format = options.format || 'none';
    }
    if (options.rfc3164) {
      if (options.rfc3164.constructor__) {
        /** @type {RFC3164} */
        this.rfc3164 = options.rfc3164;
      } else {
        this.rfc3164 = new RFC3164(options);
      }
    }
    if (options.rfc5424) {
      if (options.rfc5424.constructor__) {
        /** @type {RFC5424} */
        this.rfc5424 = options.rfc5424;
      } else {
        this.rfc5424 = new RFC5424(options);
      }
    }
    if (options.leef) {
      if (options.leef.constructor__) {
        /** @type {LEEF} */
        this.leef = options.leef;
      } else {
        this.leef = new LEEF(options);
      }
    }
    if (options.cef) {
      if (options.cef.constructor__) {
        /** @type {CEF} */
        this.cef = options.cef;
      } else {
        this.cef = new CEF(options);
      }
    }
    if (this.format === 'rfc3164' && !this.rfc3164) {
      this.rfc3164 = new RFC3164();
    }
    if (this.format === 'rfc5424' && !this.rfc5424) {
      this.rfc5424 = new RFC5424();
    }
    if (this.format === 'leef' && !this.leef) {
      this.leef = new LEEF();
    }
    if (this.format === 'cef' && !this.cef) {
      this.cef = new CEF();
    }
  }

  /**
   * Add a TLS server certificate which can be used to authenticate the server
   * this syslog client is connecting too.  This function will validate the
   * input as a file location string and add it to an array of certificates
   * @private
   * @version 0.0.0
   * @since 0.0.0
   * @param {string|string[]} certs - File location of the certificate(s)
   * @returns {boolean} - True
   * @throws {Error} - A Type Error
   */
  addTlsServerCerts(certs) {
    if (typeof certs === 'object' && Array.isArray(certs)) {
      /** @private @type {string[]} */
      this.tlsServerCerts = certs;
    } else if (typeof certs === 'string') {
      this.tlsServerCerts = [certs];
    } else {
      let errMsg =
          'TYPE ERROR: Server Cert file locations should be a string';
      errMsg += ' or array of strings';
      throw new Error(errMsg);
    }
    return true;
  }
  /**
   * Send the Syslog message over UDP
   * @private
   * @param {string} msg - The formatted Syslog Message
   * @returns {Promise} - The Syslog formatted string sent
   * @throws {Error} - Network Error
   */
  async udpMessage(msg) {
    // Test for target DNS and Address Family (IPv4/6) by looking up the DNS
    const dgram = require('dgram');
    const dnsOptions = {
      verbatim: true,
    };
    const result = await dnsPromises.lookup(this.target, dnsOptions);
    const udpType = result.family === 4 ? 'udp4' : 'udp6';
    let client = dgram.createSocket(udpType);
    // Turn msg in to a UTF8 buffer
    let msgBuffer = Buffer.from(msg, 'utf8');
    return new Promise((resolve) => {
      client.send(msgBuffer, this.port, this.target, () => {
        client.close();
        resolve(msg);
      });
    });
  }
  /**
   * Send the Syslog message over TCP
   * @private
   * @param {string} msg - The formatted Syslog Message
   * @returns {Promise} - The Syslog formatted string sent
   * @throws {Error} - Timeout error for TCP and TLS connections
   * @throws {Error} - Network Error
   */
  async tcpMessage(msg) {
    const net = require('net');
    const dnsOptions = {
      verbatim: true,
    };
    const result = await dnsPromises.lookup(this.target, dnsOptions);
    const tcpOptions = {
      host: this.target,
      port: this.port,
      family: result.family,
    };
    const client = net.createConnection(tcpOptions, () => {
      // Turn msg in to a UTF8 buffer
      let msgBuffer = Buffer.from(msg, 'utf8');
      client.write(msgBuffer, () => {
        client.end();
      });
    });
    client.setTimeout(this.tcpTimeout);
    return new Promise((resolve, reject) => {
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
    });
  }
  /**
   * Send the Syslog message over TLS
   * @private
   * @param {string} msg - The formatted Syslog Message
   * @returns {Promise} - The Syslog formatted string sent
   * @throws {Error} - Timeout error for TCP and TLS connections
   * @throws {Error} - Network Error
   */
  async tlsMessage(msg) {
    const tls = require('tls');
    const tlsOptions = {
      host: this.target,
      port: this.port,
    };
    // Load client cert and key if requested
    if (typeof this.tlsClientKey === 'string'
        && typeof this.tlsClientCert === 'string') {
      tlsOptions.key = fs.readFileSync(this.tlsClientKey);
      tlsOptions.cert = fs.readFileSync(this.tlsClientCert);
    } else if (typeof this.tlsClientKey !== 'string'
        && typeof this.tlsClientKey !== 'undefined') {
      let errMsg = 'TYPE ERROR: TLS Client Key is not a file';
      errMsg += 'location string';
      throw new Error(errMsg);
    } else if (typeof this.tlsClientCert !== 'string'
        && typeof this.tlsClientCert !== 'undefined') {
      let errMsg = 'TYPE ERROR: TLS Client Cert is not a file';
      errMsg += 'location string';
      throw new Error(errMsg);
    }
    // Load any server certs if provided
    let tlsCerts = this.tlsServerCerts.length;
    if (tlsCerts > 0) {
      let tlsOptionsCerts = [];
      for (let certIndex = 0; certIndex < tlsCerts; certIndex++) {
        if (typeof this.tlsServerCerts[certIndex] !== 'string') {
          let errMsg = 'TYPE ERROR: TLS Server Cert is not a file';
          errMsg += 'location string';
          throw new Error(errMsg);
        }
        let cert = fs.readFileSync(this.tlsServerCerts[certIndex]);
        tlsOptionsCerts.push(cert);
      }
      tlsOptions.ca = tlsOptionsCerts;
      tlsOptions.rejectUnauthorized = true;
    }
    const client = tls.connect(tlsOptions, () => {
      // Turn msg in to a UTF8 buffer
      let msgBuffer = Buffer.from(msg, 'utf8');
      client.write(msgBuffer, () => {
        client.end();
      });
    });
    client.setTimeout(this.tcpTimeout);
    return new Promise((resolve, reject) => {
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
    });
  }
  /**
   * Send the Syslog message to the selected target Syslog server using the
   * selected transport.
   * @private
   * @param {string} msg - The formatted Syslog Message
   * @returns {Promise} - The Syslog formatted string sent
   * @throws {Error} - Timeout error for TCP and TLS connections
   * @throws {Error} - Network Error
   */
  async send(msg) {
    if (typeof msg !== 'string') {
      throw new Error('TYPE ERROR: Syslog message must be a string');
    }
    this.protocol = this.protocol.toLowerCase();
    if (this.protocol === 'udp') {
      return this.udpMessage(msg);
    } else if (this.protocol === 'tcp') {
      return this.tcpMessage(msg);
    } else if (this.protocol === 'tls') {
      return this.tlsMessage(msg);
    } else {
      let errorMsg = 'FORMAT ERROR: Protocol not recognized, should be ';
      errorMsg += 'udp|tcp|tls';
      throw new Error(errorMsg);
    }
  }
}

/**
 * The base class of RFC formartted syslog messages.
 */
class RFC {
  /**
   * Sets the color to be used for messages at a set priority
   * @public
   * @param {string|number} [colors.emergencyColor] - A RGB Hex coded color in the form
   *    of #FFFFFF or as the ANSI color code number (30-37 Standard & 0-255
   *    Extended)
   * @param {string|number} [colors.alertColor] - A RGB Hex coded color in the form
   *    of #FFFFFF or as the ANSI color code number (30-37 Standard & 0-255
   *    Extended)
   * @param {string|number} [colors.criticalColor] - A RGB Hex coded color in the form
   *    of #FFFFFF or as the ANSI color code number (30-37 Standard & 0-255
   *    Extended)
   * @param {string|number} [colors.errorColor] - A RGB Hex coded color in the form
   *    of #FFFFFF or as the ANSI color code number (30-37 Standard & 0-255
   *    Extended)
   * @param {string|number} [colors.warningColor] - A RGB Hex coded color in the form
   *    of #FFFFFF or as the ANSI color code number (30-37 Standard & 0-255
   *    Extended)
   * @param {string|number} [colors.noticeColor] - A RGB Hex coded color in the form
   *    of #FFFFFF or as the ANSI color code number (30-37 Standard & 0-255
   *    Extended)
   * @param {string|number} [colors.informationalColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {string|number} [colors.debugColor] - A RGB Hex coded color in the form
   *    of #FFFFFF or as the ANSI color code number (30-37 Standard & 0-255
   *    Extended)
   * @throws {Error} A standard error object
   */
  setColor(colors, extendedColor) {
    if (colors.emergencyColor) {
      try {
        this.emergencyColor = rgbToAnsi(
          colors.emergencyColor,
          this.extendedColor
        );
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'emergencyColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    if (colors.alertColor) {
      try {
        this.alertColor = rgbToAnsi(colors.alertColor, this.extendedColor);
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'alertColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    if (colors.criticalColor) {
      try {
        this.criticalColor = rgbToAnsi(
          colors.criticalColor,
          this.extendedColor
        );
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'criticalColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    if (colors.errorColor) {
      try {
        this.errorColor = rgbToAnsi(colors.errorColor, this.extendedColor);
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'errorColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    if (colors.warningColor) {
      try {
        this.warningColor = rgbToAnsi(colors.warningColor, this.extendedColor);
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'warningColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    if (colors.noticeColor) {
      try {
        this.noticeColor = rgbToAnsi(colors.noticeColor, this.extendedColor);
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'noticeColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    if (colors.informationalColor) {
      try {
        this.informationalColor = rgbToAnsi(
          colors.informationalColor,
          this.extendedColor
        );
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'informationalColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    if (colors.debugColor) {
      try {
        this.debugColor = rgbToAnsi(colors.debugColor, this.extendedColor);
      } catch (reason) {
        reason.message = 'TYPE ERROR: ';
        reason.message += 'debugColor';
        reason.message += ' Not in RGB color hex or color code';
        throw reason;
      }
    }
    return true;
  }
}

/**
 * A class to work with RFC3164 formatted syslog messages. The messaging is
 * fully configurable and ANSI foreground colors can be added.  Both ANSI 8 and
 * ANSI 256 color are fully supported.
 *
 * A Syslog class with a configured
 * Syslog server target can also be used as the input into the formatting
 * classes so that it may run independently.
 *
 * The RFC3164 Syslog logging format is meant to be used as a stream of log data
 * from a service or application. This class is designed to be used in this
 * fashion where new messages are written to the class as needed.
 * @requires moment
 * @version 0.0.0
 * @since 0.0.0
 */
class RFC3164 extends RFC {
  /**
   * Construct a new RFC3164 formatted Syslog object with user options
   * @public
   * @this RFC3164
   * @param {object} [options] - Options object
   * @param {string} [options.applicationName=''] - Application name
   * @param {string} [options.hostname=os.hostname] - The name of this server
   * @param {number} [options.facility=23] - Facility code to use sending this
   *    message
   * @param {boolean} [options.color=false] - Apply color coding encoding tag
   *    with syslog message text
   * @param {boolean} [options.extendedColor=false] - Use the extended ANSI
   *    color set encoding tag with syslog message text
   * @param {object} [options.colors] - User defined colors for
   *    severities
   * @param {string|number} [options.colors.emergencyColor] - A RGB Hex coded color in
   *    the form of #FFFFFF or as the ANSI color code number (30-37 Standard
   *    & 0-255 Extended)
   * @param {string} [options.colors.alertColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {string|number} [options.colors.criticalColor] - A RGB Hex coded color in
   *    the form of #FFFFFF or as the ANSI color code number (30-37 Standard
   *    & 0-255 Extended)
   * @param {string|number} [options.colors.errorColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {string|number} [options.colors.warningColor] - A RGB Hex coded color in
   *    the form of #FFFFFF or as the ANSI color code number (30-37 Standard
   *     & 0-255 Extended)
   * @param {string|number} [options.colors.noticeColor] - A RGB Hex coded color in the
   *     form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *     0-255 Extended)
   * @param {string|number} [options.colors.informationalColor] - A RGB Hex coded color
   *    in the form of #FFFFFF or as the ANSI color code number (30-37
   *    Standard & 0-255 Extended)
   * @param {string|number} [options.colors.debugColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {Syslog} [options.server=false] - A {@link module:SyslogPro~Syslog|
   *    Syslog server connection} that should be used to send messages directly
   *    from this class. @see SyslogPro~Syslog
   */
  constructor(options) {
    super();
    /** @private @type {boolean} */
    this.constructor__ = true;
    options = options || {};
    /** @type {string} */
    this.hostname = options.hostname || os.hostname();
    if (options.applicationName) {
      /** @type {string} */
      this.applicationName = options.applicationName;
    } else {
      this.applicationName = options.applacationName || '';
    }
    /** @type {number} */
    this.facility = options.facility || 23;
    if (options.color) {
      /** @type {boolean} */
      this.color = true;
    } else {
      this.color = false;
    }
    if (options.extendedColor) {
      /** @type {boolean} */
      this.extendedColor = true;
    } else {
      this.extendedColor = false;
    }
    if (options.server) {
      if (!options.server.constructor__) {
        /** @private @type {Syslog} */
        this.server = new Syslog(options.server);
      } else {
        this.server = options.server;
      }
    }
    if (this.extendedColor) {
      /** @private @type {number} */
      this.emergencyColor = 1; // Red foreground color
      /** @private @type {number} */
      this.alertColor = 202; // Dark Orange foreground color
      /** @private @type {number} */
      this.criticalColor = 208; // Orange foreground color
      /** @private @type {number} */
      this.errorColor = 178; // Light Orange foreground color
      /** @private @type {number} */
      this.warningColor = 226; // Yellow foreground color
      /** @private @type {number} */
      this.noticeColor = 117; // Light Blue foreground color
      /** @private @type {number} */
      this.informationalColor = 45; // Blue foreground color
      /** @private @type {number} */
      this.debugColor = 27; // Dark Blue foreground color
    } else {
      this.emergencyColor = 31; // Red foreground color
      this.alertColor = 31; // Red foreground color
      this.criticalColor = 31; // Red foreground color
      this.errorColor = 33; // Yellow foreground color
      this.warningColor = 33; // Yellow foreground color
      this.noticeColor = 36; // Blue foreground color
      this.informationalColor = 36; // Blue foreground color
      this.debugColor = 34; // Dark Blue foreground color
    }
    if (typeof options.colors === 'object') {
      this.setColor(options.colors, this.extendedColor);
    }
  }
  /**
   * Build a formatted message.  Returns the formatted message.
   * @public
   * @param {string} msg - The unformatted Syslog message to format
   * @param {object} [options] - Options object
   * @param {number} [options.severity=6] - The message severity (0-7)
   * @param {number} [options.msgColor=36] - The ANSI color code to use if
   *    message coloration is selected
   * @returns {string} A Syslog formatted string according to the selected RFC
   * @throws {Error} A standard error object
   */
  buildMessage(msg, options) {
    options = options || {};
    let severity = typeof options.severity === 'number' ?
      options.severity : 6;
    if (typeof msg !== 'string' || options.msgSeverity > 7) {
      let errMsg = 'FORMAT ERROR: Syslog message must be a string';
      errMsg += ' msgSeverity must be a number between 0 and 7';
      throw new Error(errMsg);
    }
    let fmtMsg = ''; // Formatted Syslog message string var
    const newLine = '\n';
    const newLineRegEx = /(\r|\n|(\r\n))/;
    const escapeCode = '\u001B';
    const resetColor = '\u001B[0m';
    // The PRI is common to both RFC formats
    const pri = (this.facility * 8) + severity;
    // Remove any newline character
    msg = msg.replace(newLineRegEx, '');
    // Add requested color
    if (this.color) {
      options.msgColor = options.msgColor || 36;
      let colorCode = '[';
      if (this.extendedColor) {
        colorCode += '38;5;'; // Extended 256 Colors ANSI Code
      }
      if (typeof options.msgColor === 'number') {
        colorCode += options.msgColor;
        colorCode += 'm'; // ANSI Color Closer
      } else {
        colorCode = '[39m'; // Use terminal's default color
      }
      msg = escapeCode + colorCode + msg + resetColor;
    }
    // RegEx to find a leading 0 in the day of a DateTime for RFC3164 RFC3164
    // uses BSD timeformat
    const rfc3164DateRegEx =
/((A|D|F|J|M|N|O|S)(a|c|e|p|o|u)(b|c|g|l|n|p|r|t|v|y)\s)0(\d\s\d\d:\d\d:\d\d)/;
    const timestamp = moment()
      .format('MMM DD hh:mm:ss')
      .replace(rfc3164DateRegEx, '$1 $5');
    // Build message
    fmtMsg = '<' + pri + '>';
    fmtMsg += timestamp;
    fmtMsg += ' ' + this.hostname;
    fmtMsg += ' ' + this.applicationName;
    fmtMsg += ' ' + msg;
    fmtMsg += newLine;
    return fmtMsg;
  }
  /**
   * Send a RFC3164 formatted message.  Returns a promise with the formatted
   *    message that was sent.  If no server connection was defined when the
   *    class was created a default Syslog connector will be used.
   *    @see SyslogPro~Syslog
   * @public
   * @param {string} msg - The unformatted Syslog message to send
   * @param {object} [options] - Options object
   * @param {number} [options.severity=6] - The message severity (0-7)
   * @param {number} [options.msgColor=36] - The ANSI color code to use if
   * @returns {Promise} A Syslog formatted string according to the selected RFC
   * @throws {Error} A standard error object
   */
  async send(msg, options) {
    if (!this.server) {
      this.server = new Syslog();
    }
    const result = this.buildMessage(msg, options);
    return this.server.send(result);
  }
  /**
   * Send a Syslog message with a severity level of 0 (Emergency)
   * @public
   * @param {string} msg - The emergency message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  emergency(msg) {
    return this.send(msg, {
      severity: 0,
      msgColor: this.emergencyColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 0 (Emergency)
   * @public
   * @param {string} msg - The emergency message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  emer(msg) {
    return this.emergency(msg);
  }
  /**
   * Send a Syslog message with a severity level of 1 (Alert)
   * @public
   * @param {string} msg - The alert message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  alert(msg) {
    return this.send(msg, {
      severity: 1,
      msgColor: this.alertColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 2 (Critical)
   * @public
   * @param {string} msg - The critical message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  critical(msg) {
    return this.send(msg, {
      severity: 2,
      msgColor: this.criticalColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 2 (Critical)
   * @public
   * @param {string} msg - The critical message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  crit(msg) {
    return this.critical(msg);
  }
  /**
   * Send a Syslog message with a severity level of 3 (Error)
   * @public
   * @param {string} msg - The error message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  error(msg) {
    return this.send(msg, {
      severity: 3,
      msgColor: this.errorColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 3 (Error)
   * @public
   * @param {string} msg - The error message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  err(msg) {
    return this.error(msg);
  }
  /**
   * Send a Syslog message with a severity level of 4 (Warning)
   * @public
   * @param {string} msg - The warning message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  warning(msg) {
    return this.send(msg, {
      severity: 4,
      msgColor: this.warningColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 4 (Warning)
   * @public
   * @param {string} msg - The warning message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  warn(msg) {
    return this.warning(msg);
  }
  /**
   * Send a Syslog message with a severity level of 5 (Notice)
   * @public
   * @param {string} msg - The notice message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  notice(msg) {
    return this.send(msg, {
      severity: 5,
      msgColor: this.noticeColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 5 (Notice)
   * @public
   * @param {string} msg - The notice message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  note(msg) {
    return this.notice(msg);
  }
  /**
   * Send a Syslog message with a severity level of 6 (Informational)
   * @public
   * @param {string} msg - The informational message to send to the Syslog
   *    server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  informational(msg) {
    return this.send(msg, {
      severity: 6,
      msgColor: this.informationalColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 6 (Informational)
   * @public
   * @param {string} msg - The informational message to send to the Syslog
   *    server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  info(msg) {
    return this.informational(msg);
  }
  /**
   * Send a Syslog message with a severity level of 6 (Informational)
   * @public
   * @param {string} msg - The informational message to send to the Syslog
   *    server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  log(msg) {
    return this.informational(msg);
  }
  /**
   * Send a Syslog message with a severity level of 7 (Debug)
   * @public
   * @param {string} msg - The debug message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  debug(msg) {
    return this.send(msg, {
      severity: 7,
      msgColor: this.debugColor,
    });
  }
}

/**
 * A class to work with RFC5424 formatted syslog messages. The messaging is
 * fully configurable and ANSI foreground colors can be added.  Both ANSI 8
 * and ANSI 256 color are fully supported.
 *
 * A Syslog class with a configured
 * Syslog server target can also be used as the input into the formatting
 * classes so that it may run independently.
 *
 * The RFC5424 Syslog logging format is meant to be used as a stream of log data
 * from a service or application. This class is designed to be used in this
 * fashion where new messages are written to the class as needed.
 * @requires moment
 * @version 0.0.0
 * @since 0.0.0
 */
class RFC5424 extends RFC {
  /**
   * Construct a new RFC5424 formatted Syslog object with user options
   * @public
   * @this RFC5424
   * @param {object} [options] - Options object
   * @param {string} [options.applicationName=''] - Application name
   * @param {string} [options.hostname=os.hostname] - The name of this server
   * @param {boolean} [options.timestamp=true] - Include a timestamp
   * @param {boolean} [options.timestampUTC=false] - Whether timestamp should
   *    be relative to UTC timezone instead of local timezone
   * @param {boolean} [options.timestampMS=false] - Timestamp with ms
   *    resolution
   * @param {boolean} [options.timestampTZ=true] - Should the timestamp
   *    include time zone
   * @param {boolean} [options.includeStructuredData=false] - Include
   *    any provided structured data
   * @param {boolean} [options.utf8BOM=true] - Include the UTF8
   *    encoding tag with syslog message text
   * @param {boolean} [options.color=false] - Apply color coding encoding tag
   *    with syslog message text
   * @param {boolean} [options.extendedColor=false] - Use the extended ANSI
   *    color set encoding tag with syslog message text
   * @param {object} [options.colors] - User defined colors for
   *    severities
   * @param {string|number} [options.colors.emergencyColor] - A RGB Hex coded color in
   *    the form of #FFFFFF or as the ANSI color code number (30-37 Standard
   *    & 0-255 Extended)
   * @param {string|number} [options.colors.alertColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {string|number} [options.colors.criticalColor] - A RGB Hex coded color in
   *    the form of #FFFFFF or as the ANSI color code number (30-37 Standard
   *    & 0-255 Extended)
   * @param {string|number} [options.colors.errorColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {string|number} [options.colors.warningColor] - A RGB Hex coded color in
   *    the form of #FFFFFF or as the ANSI color code number (30-37 Standard
   *    & 0-255 Extended)
   * @param {string|number} [options.colors.noticeColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {string|number} [options.colors.informationalColor] - A RGB Hex coded color
   *    in the form of #FFFFFF or as the ANSI color code number (30-37
   *    Standard & 0-255 Extended)
   * @param {string|number} [options.colors.debugColor] - A RGB Hex coded color in the
   *    form of #FFFFFF or as the ANSI color code number (30-37 Standard &
   *    0-255 Extended)
   * @param {Syslog} [options.server=false] - A {@link module:SyslogPro~Syslog|
   *    Syslog server connection} that should be used to send messages directly
   *    from this class. @see SyslogPro~Syslog
   */
  constructor(options) {
    super();
    /** @private @type {boolean} */
    this.constructor__ = true;
    options = options || {};
    /** @type {string} */
    this.hostname = options.hostname || os.hostname();
    if (options.applicationName) {
      /** @type {string} */
      this.applicationName = options.applicationName;
    } else {
      this.applicationName = options.applacationName || '';
    }
    if (typeof options.timestamp === 'undefined' || options.timestamp) {
      /** @type {boolean} */
      this.timestamp = true;
    } else {
      this.timestamp = false;
    }
    if (options.timestampUTC) {
      /** @type {boolean} */
      this.timestampUTC = true;
    } else {
      this.timestampUTC = false;
    }
    if (typeof options.timestampTZ === 'undefined' || options.timestampTZ) {
      /** @type {boolean} */
      this.timestampTZ = true;
    } else {
      this.timestampTZ = false;
    }
    if (options.timestampMS) {
      /** @type {boolean} */
      this.timestampMS = true;
    } else {
      this.timestampMS = false;
    }
    if (options.includeStructuredData || options.encludeStructuredData) {
      /** @type {boolean} */
      this.includeStructuredData = true;
    } else {
      this.includeStructuredData = false;
    }
    if (typeof options.utf8BOM === 'undefined' || options.utf8BOM) {
      /** @type {boolean} */
      this.utf8BOM = true;
    } else {
      this.utf8BOM = false;
    }
    if (options.color) {
      /** @type {boolean} */
      this.color = true;
    } else {
      this.color = false;
    }
    if (options.extendedColor) {
      /** @type {boolean} */
      this.extendedColor = true;
    } else {
      this.extendedColor = false;
    }
    if (options.server) {
      if (!options.server.constructor__) {
        /** @private @type {Syslog} */
        this.server = new Syslog(options.server);
      } else {
        this.server = options.server;
      }
    }
    if (this.extendedColor) {
      /** @private @type {number} */
      this.emergencyColor = 1; // Red foreground color
      /** @private @type {number} */
      this.alertColor = 202; // Dark Orange foreground color
      /** @private @type {number} */
      this.criticalColor = 208; // Orange foreground color
      /** @private @type {number} */
      this.errorColor = 178; // Light Orange foreground color
      /** @private @type {number} */
      this.warningColor = 226; // Yellow foreground color
      /** @private @type {number} */
      this.noticeColor = 117; // Light Blue foreground color
      /** @private @type {number} */
      this.informationalColor = 45; // Blue foreground color
      /** @private @type {number} */
      this.debugColor = 27; // Dark Blue foreground color
    } else {
      this.emergencyColor = 31; // Red foreground color
      this.alertColor = 31; // Red foreground color
      this.criticalColor = 31; // Red foreground color
      this.errorColor = 33; // Yellow foreground color
      this.warningColor = 33; // Yellow foreground color
      this.noticeColor = 36; // Blue foreground color
      this.informationalColor = 36; // Blue foreground color
      this.debugColor = 34; // Dark Blue foreground color
    }
    if (typeof options.colors === 'object') {
      this.setColor(options.colors, this.extendedColor);
    }
  }
  /**
   * Build a formatted message.  Returns the formatted message.
   * @public
   * @param {string} msg - The unformatted Syslog message to format
   * @param {object} [options] - Options object
   * @param {number} [options.severity=6] - The message severity (0-7)
   * @param {number} [options.facility=23] - Facility code to use sending this
   *    message
   * @param {string} [options.pid='-'] - The process id of the service sending
   *    this message
   * @param {string[]} [options.msgStructuredData] - An array of structured
   *    data strings conforming to the IETF/IANA defined SD-IDs or IANA
   *    registered SMI Network Management Private Enterprise Code SD-ID
   *    conforming to the format
   *    [name@<private enterprise number> parameter=value]
   * @param {number} [options.msgColor=36] - The ANSI color code to use if
   *    message coloration is selected
   * @returns {string} A Syslog formatted string according to the selected RFC
   * @throws {Error} A standard error object
   */
  buildMessage(msg, options) {
    options = options || {};
    let severity = typeof options.severity === 'number' ?
      options.severity : 6;
    if (typeof msg !== 'string' || options.severity > 7) {
      let errMsg = 'FORMAT ERROR: Syslog message must be a string';
      errMsg += ' msgSeverity must be a number between 0 and 7';
      throw new Error(errMsg);
    }
    let facility = options.facility || 23;
    let pid = options.pid || '-';
    let id = options.id || '-';
    let msgStructuredData = options.msgStructuredData || [];
    let fmtMsg = ''; // Formated Syslog message string var
    const newLine = '\n';
    const newLineRegEx = /(\r|\n|(\r\n))/;
    const escapeCode = '\u001B';
    const resetColor = '\u001B[0m';
    // The PRI is common to both RFC formats
    const pri = (facility * 8) + severity;
    // Remove any newline character
    msg = msg.replace(newLineRegEx, '');
    // Add requested color
    if (this.color) {
      options.msgColor = options.msgColor || 36;
      let colorCode = '[';
      if (this.extendedColor) {
        colorCode += '38;5;'; // Extended 256 Colors ANSI Code
      }
      if (typeof options.msgColor === 'number') {
        colorCode += options.msgColor;
        colorCode += 'm'; // ANSI Color Closer
      } else {
        colorCode = '[39m'; // Use terminal's default color
      }
      msg = escapeCode + colorCode + msg + resetColor;
    }
    // RFC5424 timestamp formating
    let timestamp = '-';
    if (this.timestamp) {
      let timeQuality = '[timeQuality';
      if (this.timestampUTC) {
        timeQuality += ' tzKnown=1';
        if (this.timestampMS) {
          if (this.timestampTZ) {
            timestamp = moment().utc().format('YYYY-MM-DDThh:mm:ss.SSSSSSZ');
          } else {
            timestamp = moment().utc().format('YYYY-MM-DDThh:mm:ss.SSSSSS');
          }
        } else {
          if (this.timestampTZ) {
            timestamp = moment().utc().format('YYYY-MM-DDThh:mm:ssZ');
          } else {
            timestamp = moment().utc().format('YYYY-MM-DDThh:mm:ss');
          }
        }
      } else {
        if (this.timestampTZ) {
          timeQuality += ' tzKnown=1';
          if (this.timestampMS) {
            timeQuality += ' isSynced=1';
            timeQuality += ' syncAccuracy=0';
            timestamp = moment().format('YYYY-MM-DDThh:mm:ss.SSSSSSZ');
          } else {
            timestamp = moment().format('YYYY-MM-DDThh:mm:ssZ');
          }
        } else {
          timeQuality += ' tzKnown=0';
          if (this.timestampMS) {
            timeQuality += ' isSynced=1';
            timeQuality += ' syncAccuracy=0';
            timestamp = moment().format('YYYY-MM-DDThh:mm:ss.SSSSSS');
          } else {
            timestamp = moment().format('YYYY-MM-DDThh:mm:ss');
          }
        }
      }
      timeQuality += ']';
      msgStructuredData.push(timeQuality);
    }
    // Build Structured Data string
    let structuredData = '-';
    const sdElementCount = msgStructuredData.length;
    if (this.includeStructuredData && sdElementCount > 0) {
      let sdElementNames = [];
      let sdElements = [];
      const sdElementNameRegEx = /(\[)(\S*)(\s|\])/;
      // Loop to drop duplicates of the same SD Element name
      for (let elementIndex = 0;
        elementIndex < sdElementCount;
        elementIndex++) {
        let elementName =
          msgStructuredData[elementIndex]
            .match(sdElementNameRegEx)[2];
        if (!sdElementNames.includes(elementName)) {
          sdElementNames.push(elementName);
          sdElements.push(msgStructuredData[elementIndex]);
        }
      }
      structuredData = sdElements.join('');
    }
    // Build the message
    fmtMsg = '<' + pri + '>';
    fmtMsg += '1'; // Version number
    fmtMsg += ' ' + timestamp;
    fmtMsg += ' ' + this.hostname;
    fmtMsg += ' ' + this.applicationName;
    fmtMsg += ' ' + pid;
    fmtMsg += ' ' + id;
    fmtMsg += ' ' + structuredData;
    if (this.utf8BOM) {
      fmtMsg += ' BOM' + msg;
    } else {
      fmtMsg += ' ' + msg;
    }
    fmtMsg += newLine;
    return fmtMsg;
  }
  /**
   * send a RFC5424 formatted message.  Returns a promise with the formatted
   *    message that was sent.  If no server connection was defined when the
   *    class was created a default Syslog connector will be used.
   *    @see SyslogPro~Syslog
   * @public
   * @param {string} msg - The unformatted Syslog message to send
   * @returns {Promise} A Syslog formatted string according to the selected RFC
   * @throws {Error} A standard error object
   */
  async send(msg, options) {
    if (!this.server) {
      this.server = new Syslog();
    }
    const result = this.buildMessage(msg, options);
    return this.server.send(result);
  }
  /**
   * Send a Syslog message with a severity level of 0 (Emergency)
   * @public
   * @param {string} msg - The emergency message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  emergency(msg) {
    return this.send(msg, {
      severity: 0,
      msgColor: this.emergencyColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 0 (Emergency)
   * @public
   * @param {string} msg - The emergency message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  emer(msg) {
    return this.emergency(msg);
  }
  /**
   * Send a Syslog message with a severity level of 1 (Alert)
   * @public
   * @param {string} msg - The alert message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  alert(msg) {
    return this.send(msg, {
      severity: 1,
      msgColor: this.alertColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 2 (Critical)
   * @public
   * @param {string} msg - The critical message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  critical(msg) {
    return this.send(msg, {
      severity: 2,
      msgColor: this.criticalColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 2 (Critical)
   * @public
   * @param {string} msg - The critical message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  crit(msg) {
    return this.critical(msg);
  }
  /**
   * Send a Syslog message with a severity level of 3 (Error)
   * @public
   * @param {string} msg - The error message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  error(msg) {
    return this.send(msg, {
      severity: 3,
      msgColor: this.errorColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 3 (Error)
   * @public
   * @param {string} msg - The error message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  err(msg) {
    return this.error(msg);
  }
  /**
   * Send a Syslog message with a severity level of 4 (Warning)
   * @public
   * @param {string} msg - The warning message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  warning(msg) {
    return this.send(msg, {
      severity: 4,
      msgColor: this.warningColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 4 (Warning)
   * @public
   * @param {string} msg - The warning message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  warn(msg) {
    return this.warning(msg);
  }
  /**
   * Send a Syslog message with a severity level of 5 (Notice)
   * @public
   * @param {string} msg - The notice message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  notice(msg) {
    return this.send(msg, {
      severity: 5,
      msgColor: this.noticeColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 5 (Notice)
   * @public
   * @param {string} msg - The notice message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  note(msg) {
    return this.notice(msg);
  }
  /**
   * Send a Syslog message with a severity level of 6 (Informational)
   * @public
   * @param {string} msg - The informational message to send to the Syslog
   *    server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  informational(msg) {
    return this.send(msg, {
      severity: 6,
      msgColor: this.informationalColor,
    });
  }
  /**
   * Send a Syslog message with a severity level of 6 (Informational)
   * @public
   * @param {string} msg - The informational message to send to the Syslog
   *    server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  info(msg) {
    return this.informational(msg);
  }
  /**
   * Send a Syslog message with a severity level of 6 (Informational)
   * @public
   * @param {string} msg - The informational message to send to the Syslog
   *    server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  log(msg) {
    return this.informational(msg);
  }
  /**
   * Send a Syslog message with a severity level of 7 (Debug)
   * @public
   * @param {string} msg - The debug message to send to the Syslog server
   * @returns {Promise} - The formatted syslog message sent to the Syslog server
   * @throws {Error} - Any bubbled-up error
   */
  debug(msg) {
    return this.send(msg, {
      severity: 7,
      msgColor: this.debugColor,
    });
  }
}

/**
 * A class to work with IBM LEEF (Log Event Extended Format) messages. This form
 * of system messages is designed to work with security systems.  Messages can
 * be saved to file (Saving to file is not part of this module but a LEEF
 * formatted message produced by this module can be saved externally to it) or
 * sent via Syslog.
 *
 * A Syslog class with a configured Syslog server target can also be used as
 * the input into the formatting classes so that it may run independently. The
 * LEEF format is designed to send event data to a SIEM system and should not
 * be used as a logging stream. This class is meant to be used once per message.
 * @requires moment
 * @version 0.0.0
 * @since 0.0.0
 */
class LEEF {
  /**
   * Construct a new LEEF formatting object with user options
   * @public
   * @param {object} [options] - Options object
   * @param {string} [options.vendor='unknown'] - The vendor of the system that
   *    generated the event being reported
   * @param {string} [options.product='unknown'] - The product name of the
   *    system that generated the event being reported
   * @param {string} [options.version='unknown'] - The version name of the
   *    system that generated the event being reported
   * @param {string} [options.eventId='unknown'] - The eventId of the
   *    system that generated the event being reported
   * @param {object} [options.attributes] - LEEF message attributes which
   *    defaults to all base attributes with null values, new attributes should
   *    be added as new elements to this object
   * @param {boolean} [options.syslogHeader=true] - Should the LEEF message
   *    include a Syslog header with timestamp and source
   * @param {Syslog} [options.server=false] - A {@link module:SyslogPro~Syslog|
   *    Syslog server connection} that should be used to send messages directly
   *    from this class. @see SyslogPro~Syslog
   */
  constructor(options) {
    /** @private @type {boolean} */
    this.constructor__ = true;
    options = options || {};
    /** @type {string} */
    this.vendor = options.vendor || 'unknown';
    /** @type {string} */
    this.product = options.product || 'unknown';
    /** @type {string} */
    this.version = options.version || 'unknown';
    /** @type {string} */
    this.eventId = options.eventId || 'unknown';
    /** @type {boolean} */
    this.syslogHeader = typeof options.syslogHeader === 'boolean'
      ? options.syslogHeader : true;
    /** @type {object} */
    this.attributes = options.attributes || {
      cat: null,
      devTime: null,
      devTimeFormat: null,
      proto: null,
      sev: null,
      src: null,
      dst: null,
      srcPort: null,
      dstPort: null,
      srcPreNAT: null,
      dstPreNAT: null,
      srcPostNAT: null,
      dstPostNAT: null,
      usrName: null,
      srcMAC: null,
      dstMAC: null,
      srcPreNATPort: null,
      dstPreNATPort: null,
      srcPostNATPort: null,
      dstPostNATPort: null,
      identSrc: null,
      identHostName: null,
      identNetBios: null,
      identGrpName: null,
      identMAC: null,
      vSrc: null,
      vSrcName: null,
      accountName: null,
      srcBytes: null,
      dstBytes: null,
      srcPackets: null,
      dstPackets: null,
      totalPackets: null,
      role: null,
      realm: null,
      policy: null,
      resource: null,
      url: null,
      groupID: null,
      domain: null,
      isLoginEvent: null,
      isLogoutEvent: null,
      identSecondlp: null,
      calLanguage: null,
      AttributeLimits: null,
      calCountryOrRegion: null,
    };
    if (options.server) {
      if (options.server.constructor__) {
        /** @private @type {Syslog} */
        this.server = options.server;
      } else {
        this.server = new Syslog(options.server);
      }
    }
  }
  /**
   * Build a formatted message
   * @public
   * @return {string} - string with formatted message
   */
  buildMessage() {
    let fmtMsg = 'LEEF:2.0';
    fmtMsg += '|' + this.vendor;
    fmtMsg += '|' + this.product;
    fmtMsg += '|' + this.version;
    fmtMsg += '|' + this.eventId;
    fmtMsg += '|';

    // Build LEEF Attributes
    const Tab = '\x09';
    const leefAttribs = Object.entries(this.attributes);
    const leefAttribsLen = leefAttribs.length;
    for (let attrib = 0; attrib < leefAttribsLen; attrib++) {
      if (leefAttribs[attrib][1] !== null) {
        fmtMsg += leefAttribs[attrib][0] + '=' + leefAttribs[attrib][1] + Tab;
      }
    }
    return fmtMsg;
  }

  /**
   * Send a LEEF formatted message
   * @public
   * @param {Syslog} [options=false] - A {@link module:SyslogPro~Syslog|
   *    Syslog server connection} that should be used to send messages directly
   *    from this class. @see SyslogPro~Syslog
   */
  async send(options) {
    const result = this.buildMessage();
    if (!this.server) {
      this.server = new Syslog(options);
    }
    return this.server.send(result);
  }
}

/**
 * A class to work with HP CEF (Common Event Format) messages. This form
 * of system messages is designed to work with security systems.  Messages can
 * be saved to file (Saving to file is not part of this module but a CEF
 * formatted message produced by this module can be saved externally to it) or
 * sent via Syslog.
 *
 * A Syslog class with a configured Syslog server target can also be used as
 * the input into the formatting classes so that it may run independently. The
 * CEF format is designed to send event data to a SIEM system and should not be
 * used as a logging stream. This class is meant to be used once per message.
 * @requires moment
 * @version 0.0.0
 * @since 0.0.0
 */
class CEF {
  /**
   * Construct a new CEF formatting object with user options
   * @public
   * @param {object} [options] - Options object
   * @param {string} [options.deviceVendor='Unknown'] - The vendor of the system
   *    that generated the event being reported
   * @param {string} [options.deviceProduct='Unknown'] - The product name of the
   *    system that generated the event being reported
   * @param {string} [options.deviceVersion='Unknown'] - The version name of the
   *    system that generated the event being reported
   * @param {string} [options.deviceEventClassId='Unknown'] - The eventId of the
   *    system that generated the event being reported
   * @param {string} [options.name='Unknown'] - Name of the service generating
   *    the notice
   * @param {string} [options.severity='Unknown'] - Severity of the notification
   * @param {string} [options.extensions={}] - Any CEF Key=Value extensions
   * @param {Syslog} [options.server=false] - A {@link module:SyslogPro~Syslog|
   *    Syslog server connection} that should be used to send messages directly
   *    from this class. @see SyslogPro~Syslog
   */
  constructor(options) {
    /** @private @type {boolean} */
    this.constructor__ = true;
    options = options || {};
    /** @type {string} */
    this.deviceVendor = options.deviceVendor || 'Unknown';
    /** @type {string} */
    this.deviceProduct = options.deviceProduct || 'Unknown';
    /** @type {string} */
    this.deviceVersion = options.deviceVersion || 'Unknown';
    /** @type {string} */
    this.deviceEventClassId = options.deviceEventClassId || 'Unknown';
    /** @type {string} */
    this.name = options.name || 'Unknown';
    /** @type {string} */
    this.severity = options.severity || 'Unknown';
    /** @type {object} */
    this.extensions = options.extensions || {
      deviceAction: null,
      applicationProtocol: null,
      deviceCustomIPv6Address1: null,
      'deviceCustomIPv6 Address1Label': null,
      deviceCustomIPv6Address3: null,
      'deviceCustomIPv6Address3 Label': null,
      'deviceCustomIPv6 Address4': null,
      'deviceCustomIPv6 Address4Label': null,
      deviceEventCategory: null,
      deviceCustomFloatingPoint1: null,
      'deviceCustom FloatingPoint1Label': null,
      deviceCustomFloatingPoint2: null,
      'deviceCustomFloatingPoint2 Label': null,
      deviceCustomFloatingPoint3: null,
      'deviceCustom FloatingPoint3Label': null,
      deviceCustomFloatingPoint4: null,
      'deviceCustom FloatingPoint4Label': null,
      deviceCustomNumber1: null,
      deviceCustomNumber1Label: null,
      DeviceCustomNumber2: null,
      deviceCustomNumber2Label: null,
      deviceCustomNumber3: null,
      deviceCustomNumber3Label: null,
      baseEventCount: null,
      deviceCustomString1: null,
      deviceCustomString1Label: null,
      deviceCustomString2: null,
      deviceCustomString2Label: null,
      deviceCustomString3: null,
      deviceCustomString3Label: null,
      deviceCustomString4: null,
      deviceCustomString4Label: null,
      deviceCustomString5: null,
      deviceCustomString5Label: null,
      deviceCustomString6: null,
      deviceCustomString6Label: null,
      destinationDnsDomain: null,
      destinationServiceName: null,
      'destinationTranslated Address': null,
      destinationTranslatedPort: null,
      deviceCustomDate1: null,
      deviceCustomDate1Label: null,
      deviceCustomDate2: null,
      deviceCustomDate2Label: null,
      deviceDirection: null,
      deviceDnsDomain: null,
      deviceExternalId: null,
      deviceFacility: null,
      deviceInboundInterface: null,
      deviceNtDomain: null,
      deviceOutboundInterface: null,
      devicePayloadId: null,
      deviceProcessName: null,
      deviceTranslatedAddress: null,
      destinationHostName: null,
      destinationMacAddress: null,
      destinationNtDomain: null,
      destinationProcessId: null,
      destinationUserPrivileges: null,
      destinationProcessName: null,
      destinationPort: null,
      destinationAddress: null,
      deviceTimeZone: null,
      destinationUserId: null,
      destinationUserName: null,
      deviceAddress: null,
      deviceHostName: null,
      deviceMacAddress: null,
      deviceProcessId: null,
      endTime: null,
      externalId: null,
      fileCreateTime: null,
      fileHash: null,
      fileId: null,
      fileModificationTime: null,
      filePath: null,
      filePermission: null,
      fileType: null,
      flexDate1: null,
      flexDate1Label: null,
      flexString1: null,
      flexString1Label: null,
      flexString2: null,
      flexString2Label: null,
      filename: null,
      fileSize: null,
      bytesIn: null,
      message: null,
      oldFileCreateTime: null,
      oldFileHash: null,
      oldFileId: null,
      oldFileModificationTime: null,
      oldFileName: null,
      oldFilePath: null,
      oldFileSize: null,
      oldFileType: null,
      bytesOut: null,
      eventOutcome: null,
      transportProtocol: null,
      Reason: null,
      requestUrl: null,
      requestClientApplication: null,
      requestContext: null,
      requestCookies: null,
      requestMethod: null,
      deviceReceiptTime: null,
      sourceHostName: null,
      sourceMacAddress: null,
      sourceNtDomain: null,
      sourceDnsDomain: null,
      sourceServiceName: null,
      sourceTranslatedAddress: null,
      sourceTranslatedPort: null,
      sourceProcessId: null,
      sourceUserPrivileges: null,
      sourceProcessName: null,
      sourcePort: null,
      sourceAddress: null,
      startTime: null,
      sourceUserId: null,
      sourceUserName: null,
      type: null,
      agentDnsDomain: null,
      agentNtDomain: null,
      agentTranslatedAddress: null,
      'agentTranslatedZone ExternalID': null,
      agentTranslatedZoneURI: null,
      agentZoneExternalID: null,
      agentZoneURI: null,
      agentAddress: null,
      agentHostName: null,
      agentId: null,
      agentMacAddress: null,
      agentReceiptTime: null,
      agentType: null,
      agentTimeZone: null,
      agentVersion: null,
      customerExternalID: null,
      customerURI: null,
      'destinationTranslated ZoneExternalID': null,
      'destinationTranslated ZoneURI': null,
      destinationZoneExternalID: null,
      destinationZoneURI: null,
      'deviceTranslatedZone ExternalID': null,
      deviceTranslatedZoneURI: null,
      deviceZoneExternalID: null,
      deviceZoneURI: null,
      destinationGeoLatitude: null,
      destinationGeoLongitude: null,
      eventId: null,
      rawEvent: null,
      sourceGeoLatitude: null,
      sourceGeoLongitude: null,
      'sourceTranslatedZone ExternalID': null,
      sourceTranslatedZoneURI: null,
      sourceZoneExternalID: null,
      sourceZoneURI: null,
    };
    if (options.server) {
      if (options.server.constructor__) {
        /** @private @type {Syslog} */
        this.server = options.server;
      } else {
        this.server = new Syslog(options.server);
      }
    }
  }
  /**
   * Validate this CEF object
   * @public
   * @return {boolean} - True if validated
   * @throws {Error} - First element to fail validation
   */
  validate() {
    const Extensions = {
      deviceAction: {
        key: 'act',
        type: 'String',
        len: 63,
        discription: 'Action taken by the device.',
      },
      applicationProtocol: {
        key: 'app',
        type: 'String',
        len: 31,
        discription: 'Application level protocol, example values are HTTP, ' +
            'HTTPS, SSHv2, Telnet, POP, IMPA, IMAPS, and so on.',
      },
      deviceCustomIPv6Address1: {
        key: 'c6a1',
        type: 'String',
        len: null,
        discription: 'One of four IPv6 address fields available to map ' +
            'fields that do not apply to any other in this dictionary. ' +
            'TIP: See the guidelines under “User-Defined Extensions” for ' +
            'tips on using these fields.',
      },
      'deviceCustomIPv6 Address1Label': {
        key: 'c6a1Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomIPv6Address3: {
        key: 'c6a3',
        type: 'String',
        len: null,
        discription: 'One of four IPv6 address fields available to map ' +
            'fields that do not apply to any other in this dictionary. ' +
            'TIP: See the guidelines under “User-Defined Extensions” for ' +
            'tips on using these fields.',
      },
      'deviceCustomIPv6Address3 Label': {
        key: 'c6a3Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      'deviceCustomIPv6 Address4': {
        key: 'c6a4',
        type: 'String',
        len: null,
        discription: 'One of four IPv6 address fields available to map ' +
            'fields that do not apply to any other in this dictionary. ' +
            'TIP: See the guidelines under “User-Defined Extensions” for ' +
            'tips on using these fields.',
      },
      'deviceCustomIPv6 Address4Label': {
        key: 'C6a4Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceEventCategory: {
        key: 'cat',
        type: 'String',
        len: 1023,
        discription: 'Represents the category assigned by the originating ' +
            'device. Devices often use their own categorization schema to ' +
            'classify event. Example: “/Monitor/Disk/Read”',
      },
      deviceCustomFloatingPoint1: {
        key: 'cfp1',
        type: 'Number',
        len: null,
        discription: 'One of four floating point fields available to map ' +
            'fields that do not apply to any other in this dictionary.',
      },
      'deviceCustom FloatingPoint1Label': {
        key: 'cfp1Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomFloatingPoint2: {
        key: 'cfp2',
        type: 'Number',
        len: null,
        discription: 'One of four floating point fields available to map ' +
            'fields that do not apply to any other in this dictionary.',
      },
      'deviceCustomFloatingPoint2 Label': {
        key: 'cfp2Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomFloatingPoint3: {
        key: 'cfp3',
        type: 'Number',
        len: null,
        discription: 'One of four floating point fields available to map ' +
            'fields that do not apply to any other in this dictionary.',
      },
      'deviceCustom FloatingPoint3Label': {
        key: 'cfp3Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomFloatingPoint4: {
        key: 'cfp4',
        type: 'Number',
        len: null,
        discription: 'One of four floating point fields available to map ' +
            'fields that do not apply to any other in this dictionary.',
      },
      'deviceCustom FloatingPoint4Label': {
        key: 'cfp4Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomNumber1: {
        key: 'cn1',
        type: 'Number',
        len: null,
        discription: 'One of three number fields available to map fields ' +
            'that do not apply to any other in this dictionary. Use ' +
            'sparingly and seek a more specific dictionary supplied field ' +
            'when possible.',
      },
      deviceCustomNumber1Label: {
        key: 'cn1Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      DeviceCustomNumber2: {
        key: 'cn2',
        type: 'Number',
        len: null,
        discription: 'One of three number fields available to map fields ' +
            'that do not apply to any other in this dictionary. Use ' +
            'sparingly and seek a more specific, dictionary supplied field ' +
            'when possible.',
      },
      deviceCustomNumber2Label: {
        key: 'cn2Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomNumber3: {
        key: 'cn3',
        type: 'Number',
        len: null,
        discription: 'One of three number fields available to map fields ' +
            'that do not apply to any other in this dictionary. Use ' +
            'sparingly and seek a more specific, dictionary supplied field ' +
            'when possible.',
      },
      deviceCustomNumber3Label: {
        key: 'cn3Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      baseEventCount: {
        key: 'cnt',
        type: 'Number',
        len: null,
        discription: 'A count associated with this event. How many times ' +
            'was this same event observed? Count can be omitted if it is 1.',
      },
      deviceCustomString1: {
        key: 'cs1',
        type: 'String',
        len: 4000,
        discription: 'One of six strings available to map fields that do ' +
            'not apply to any other in this dictionary. Use sparingly and ' +
            'seek a more specific, dictionary supplied field when ' +
            'possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomString1Label: {
        key: 'cs1Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomString2: {
        key: 'cs2',
        type: 'String',
        len: 4000,
        discription: 'One of six strings available to map fields that do ' +
            'not apply to any other in this dictionary. Use sparingly and ' +
            'seek a more specific, dictionary supplied field when ' +
            'possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomString2Label: {
        key: 'cs2Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomString3: {
        key: 'cs3',
        type: 'String',
        len: 4000,
        discription: 'One of six strings available to map fields that do ' +
            'not apply to any other in this dictionary. Use sparingly and ' +
            'seek a more specific, dictionary supplied field when ' +
            'possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomString3Label: {
        key: 'cs3Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomString4: {
        key: 'cs4',
        type: 'String',
        len: 4000,
        discription: 'One of six strings available to map fields that do ' +
            'not apply to any other in this dictionary. Use sparingly and ' +
            'seek a more specific, dictionary supplied field when ' +
            'possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomString4Label: {
        key: 'cs4Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomString5: {
        key: 'cs5',
        type: 'String',
        len: 4000,
        discription: 'One of six strings available to map fields that do ' +
            'not apply to any other in this dictionary. Use sparingly and ' +
            'seek a more specific, dictionary supplied field when ' +
            'possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomString5Label: {
        key: 'cs5Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomString6: {
        key: 'cs6',
        type: 'String',
        len: 4000,
        discription: 'One of six strings available to map fields that do ' +
            'not apply to any other in this dictionary. Use sparingly and ' +
            'seek a more specific, dictionary supplied field when ' +
            'possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomString6Label: {
        key: 'cs6Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      destinationDnsDomain: {
        key: 'destination DnsDomain',
        type: 'String',
        len: 255,
        discription: 'The DNS domain part of the complete fully qualified ' +
            'domain name (FQDN).',
      },
      destinationServiceName: {
        key: 'destination ServiceName',
        type: 'String',
        len: 1023,
        discription: 'The service targeted by this event. Example: “sshd”',
      },
      'destinationTranslated Address': {
        key: 'Destination Translated Address',
        type: 'String',
        len: null,
        discription: 'Identifies the translated destination that the event ' +
            'refers to in an IP network. The format is an IPv4 address. ' +
            'Example: “192.168.10.1”',
      },
      destinationTranslatedPort: {
        key: 'Destination TranslatedPort',
        type: 'Number',
        len: null,
        discription: 'Port after it was translated; for example, a ' +
            'firewall. Valid port numbers are 0 to 65535.',
      },
      deviceCustomDate1: {
        key: 'deviceCustom Date1',
        type: 'String',
        len: null,
        discription: 'One of two timestamp fields available to map fields ' +
            'that do not apply to any other in this dictionary. Use ' +
            'sparingly and seek a more specific, dictionary supplied field ' +
            'when possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomDate1Label: {
        key: 'deviceCustom Date1Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceCustomDate2: {
        key: 'deviceCustom Date2',
        type: 'String',
        len: null,
        discription: 'One of two timestamp fields available to map fields ' +
            'that do not apply to any other in this dictionary. Use ' +
            'sparingly and seek a more specific, dictionary supplied field ' +
            'when possible. TIP: See the guidelines under “User-Defined ' +
            'Extensions” for tips on using these fields.',
      },
      deviceCustomDate2Label: {
        key: 'deviceCustom Date2Label',
        type: 'String',
        len: 1023,
        discription: 'All custom fields have a corresponding label field. ' +
            'Each of these fields is a string and describes the purpose of ' +
            'the custom field.',
      },
      deviceDirection: {
        key: 'deviceDirection',
        type: 'Number',
        len: null,
        discription: 'Any information about what direction the observed ' +
            'communication has taken. The following values are supported: ' +
            '“0” for inbound or “1” for outbound',
      },
      deviceDnsDomain: {
        key: 'deviceDns Domain',
        type: 'String',
        len: 255,
        discription: 'The DNS domain part of the complete fully qualified ' +
            'domain name (FQDN).',
      },
      deviceExternalId: {
        key: 'device ExternalId',
        type: 'String',
        len: 255,
        discription: 'A name that uniquely identifies the device ' +
            'generating this event.',
      },
      deviceFacility: {
        key: 'deviceFacility',
        type: 'String',
        len: 1023,
        discription: 'The facility generating this event. For example, ' +
            'Syslog has an explicit facility associated with every event.',
      },
      deviceInboundInterface: {
        key: 'deviceInbound Interface',
        type: 'String',
        len: 128,
        discription: 'Interface on which the packet or data entered the ' +
            'device.',
      },
      deviceNtDomain: {
        key: 'deviceNt Domain',
        type: 'String',
        len: 255,
        discription: 'The Windows domain name of the device address.',
      },
      deviceOutboundInterface: {
        key: 'Device Outbound Interface',
        type: 'String',
        len: 128,
        discription: 'Interface on which the packet or data left the ' +
            'device.',
      },
      devicePayloadId: {
        key: 'Device PayloadId',
        type: 'String',
        len: 128,
        discription: 'Unique identifier for the payload associated with ' +
            'the event.',
      },
      deviceProcessName: {
        key: 'deviceProcess Name',
        type: 'String',
        len: 1023,
        discription: 'Process name associated with the event. An example ' +
            'might be the process generating the syslog entry in UNIX.',
      },
      deviceTranslatedAddress: {
        key: 'device Translated Address',
        type: 'String',
        len: null,
        discription: 'Identifies the translated device address that the ' +
            'event refers to in an IP network. The format is an IPv4 ' +
            'address. Example: “192.168.10.1”',
      },
      destinationHostName: {
        key: 'dhost',
        type: 'String',
        len: 1023,
        discription: 'Identifies the destination that an event refers to ' +
            'in an IP network. The format should be a fully qualified ' +
            'domain name (FQDN) associated with the destination node, when ' +
            'a node is available. Examples: “host.domain.com” or “host”.',
      },
      destinationMacAddress: {
        key: 'dmac',
        type: 'String',
        len: null,
        discription: 'Six colon-seperated hexadecimal numbers. Example: ' +
            '“00:0D:60:AF:1B:61”',
      },
      destinationNtDomain: {
        key: 'dntdom',
        type: 'String',
        len: 255,
        discription: 'The Windows domain name of the destination address.',
      },
      destinationProcessId: {
        key: 'dpid',
        type: 'Number',
        len: null,
        discription: 'Provides the ID of the destination process ' +
            'associated with the event. For example, if an event contains ' +
            'process ID 105, 105” is the process ID.',
      },
      destinationUserPrivileges: {
        key: 'dpriv',
        type: 'String',
        len: 1023,
        discription: 'The typical values are “Administrator”, “User”, and ' +
            '“Guest”. This identifies the destination user’s privileges. ' +
            'In UNIX, for example, activity executed on the root user ' +
            'would be identified with destinationUser Privileges of ' +
            '“Administrator”.',
      },
      destinationProcessName: {
        key: 'dproc',
        type: 'String',
        len: 1023,
        discription: 'The name of the event’s destination process. ' +
            'Example: “telnetd” or “sshd”.',
      },
      destinationPort: {
        key: 'dpt',
        type: 'Number',
        len: null,
        discription: 'The valid port numbers are between 0 and 65535.',
      },
      destinationAddress: {
        key: 'dst',
        type: 'String',
        len: null,
        discription: 'Identifies the destination address that the event ' +
            'refers to in an IP network. The format is an IPv4 address. ' +
            'Example: “192.168.10.1”',
      },
      deviceTimeZone: {
        key: 'dtz',
        type: 'String',
        len: 255,
        discription: 'The timezone for the device generating the event.',
      },
      destinationUserId: {
        key: 'duid',
        type: 'String',
        len: 1023,
        discription: 'Identifies the destination user by ID. For example, ' +
            'in UNIX, the root user is generally associated with user ' +
            'ID 0.',
      },
      destinationUserName: {
        key: 'duser',
        type: 'String',
        len: 1023,
        discription: 'Identifies the destination user by name. This is the ' +
            'user associated with the event’s destination. Email addresses ' +
            'are often mapped into the UserName fields. The recipient is a ' +
            'candidate to put into this field.',
      },
      deviceAddress: {
        key: 'dvc',
        type: 'String',
        len: null,
        discription: 'Identifies the device address that an event refers ' +
            'to in an IP network. The format is an IPv4 address. Example: ' +
            '“192.168.10.1”.',
      },
      deviceHostName: {
        key: 'dvchost',
        type: 'String',
        len: 100,
        discription: 'The format should be a fully qualified domain name ' +
            '(FQDN) associated with the device node, when a node is ' +
            'available. Example: “host.domain.com” or “host”.',
      },
      deviceMacAddress: {
        key: 'dvcmac',
        type: 'String',
        len: null,
        discription: 'Six colon-separated hexadecimal numbers. Example: ' +
            '“00:0D:60:AF:1B:61”',
      },
      deviceProcessId: {
        key: 'dvcpid',
        type: 'Number',
        len: null,
        discription: 'Provides the ID of the process on the device ' +
            'generating the event.',
      },
      endTime: {
        key: 'end',
        type: 'String',
        len: null,
        discription: 'The time at which the activity related to the event ' +
            'ended. The format is MMM dd yyyy HH:mm:ss or milliseconds ' +
            'since epoch (Jan 1st1970). An example would be reporting the ' +
            'end of a session.',
      },
      externalId: {
        key: 'externalId',
        type: 'String',
        len: 40,
        discription: 'The ID used by an originating device. They are ' +
            'usually increasing numbers, associated with events.',
      },
      fileCreateTime: {
        key: 'fileCreateTime',
        type: 'String',
        len: null,
        discription: 'Time when the file was created.',
      },
      fileHash: {
        key: 'fileHash',
        type: 'String',
        len: 255,
        discription: 'Hash of a file.',
      },
      fileId: {
        key: 'fileId',
        type: 'String',
        len: 1023,
        discription: 'An ID associated with a file could be the inode.',
      },
      fileModificationTime: {
        key: 'fileModification Time',
        type: 'String',
        len: null,
        discription: 'Time when the file was last modified.',
      },
      filePath: {
        key: 'filePath',
        type: 'String',
        len: 1023,
        discription: 'Full path to the file, including file name itself. ' +
            'Example: C:\Program Files \WindowsNT\Accessories\ wordpad.exe ' +
            'or /usr/bin/zip',
      },
      filePermission: {
        key: 'filePermission',
        type: 'String',
        len: 1023,
        discription: 'Permissions of the file.',
      },
      fileType: {
        key: 'fileType',
        type: 'String',
        len: 1023,
        discription: 'Type of file (pipe, socket, etc.)',
      },
      flexDate1: {
        key: 'flexDate1',
        type: 'String',
        len: null,
        discription: 'A timestamp field available to map a timestamp that ' +
            'does not apply to any other defined timestamp field in this ' +
            'dictionary. Use all flex fields sparingly and seek a more ' +
            'specific, dictionary supplied field when possible. These ' +
            'fields are typically reserved for customer use and should not ' +
            'be set by vendors unless necessary.',
      },
      flexDate1Label: {
        key: 'flexDate1Label',
        type: 'String',
        len: 128,
        discription: 'The label field is a string and describes the ' +
            'purpose of the flex field.',
      },
      flexString1: {
        key: 'flexString1',
        type: 'String',
        len: 1023,
        discription: 'One of four floating point fields available to map ' +
            'fields that do not apply to any other in this dictionary. Use ' +
            'sparingly and seek a more specific, dictionary supplied field ' +
            'when possible. These fields are typically reserved for ' +
            'customer use and should not be set by vendors unless ' +
            'necessary.',
      },
      flexString1Label: {
        key: 'flexString1 Label',
        type: 'String',
        len: 128,
        discription: 'The label field is a string and describes the ' +
            'purpose of the flex field.',
      },
      flexString2: {
        key: 'flexString2',
        type: 'String',
        len: 1023,
        discription: 'One of four floating point fields available to map ' +
            'fields that do not apply to any other in this dictionary. Use ' +
            'sparingly and seek a more specific, dictionary supplied field ' +
            'when possible. These fields are typically reserved for ' +
            'customer use and should not be set by vendors unless ' +
            'necessary.',
      },
      flexString2Label: {
        key: 'flex String2Label',
        type: 'String',
        len: 128,
        discription: 'The label field is a string and describes the ' +
            'purpose of the flex field.',
      },
      filename: {
        key: 'fname',
        type: 'String',
        len: 1023,
        discription: 'Name of the file only (without its path).',
      },
      fileSize: {
        key: 'fsize',
        type: 'Number',
        len: null,
        discription: 'Size of the file.',
      },
      bytesIn: {
        key: 'in',
        type: 'Number',
        len: null,
        discription: 'Number of bytes transferred inbound, relative to the ' +
            'source to destination relationship, meaning that data was ' +
            'flowing from source to destination.',
      },
      message: {
        key: 'msg',
        type: 'String',
        len: 1023,
        discription: 'An arbitrary message giving more details about the ' +
            'event. Multi-line entries can be produced by using \n as the ' +
            'new line separator.',
      },
      oldFileCreateTime: {
        key: 'oldFileCreate Time',
        type: 'String',
        len: null,
        discription: 'Time when old file was created.',
      },
      oldFileHash: {
        key: 'oldFileHash',
        type: 'String',
        len: 255,
        discription: 'Hash of the old file.',
      },
      oldFileId: {
        key: 'oldFileId',
        type: 'String',
        len: 1023,
        discription: 'An ID associated with the old file could be the ' +
            'inode.',
      },
      oldFileModificationTime: {
        key: 'oldFile Modification Time',
        type: 'String',
        len: null,
        discription: 'Time when old file was last modified.',
      },
      oldFileName: {
        key: 'oldFileName',
        type: 'String',
        len: 1023,
        discription: 'Name of the old file.',
      },
      oldFilePath: {
        key: 'oldFilePath',
        type: 'String',
        len: 1023,
        discription: 'Full path to the old fiWindowsNT\\Accessories le, ' +
            'including the file name itself. Examples: c:\\Program ' +
            'Files\\wordpad.exe or /usr/bin/zip',
      },
      oldFileSize: {
        key: 'oldFileSize',
        type: 'Number',
        len: null,
        discription: 'Size of the old file.',
      },
      oldFileType: {
        key: 'oldFileType',
        type: 'String',
        len: 1023,
        discription: 'Type of the old file (pipe, socket, etc.)',
      },
      bytesOut: {
        key: 'out',
        type: 'Number',
        len: null,
        discription: 'Number of bytes transferred outbound relative to the ' +
            'source to destination relationship. For example, the byte ' +
            'number of data flowing from the destination to the source.',
      },
      eventOutcome: {
        key: 'outcome',
        type: 'String',
        len: 63,
        discription: 'Displays the outcome, usually as ‘success’ or ' +
            '‘failure’.',
      },
      transportProtocol: {
        key: 'proto',
        type: 'String',
        len: 31,
        discription: 'Identifies the Layer-4 protocol used. The possible ' +
            'values are protocols such as TCP or UDP.',
      },
      Reason: {
        key: 'reason',
        type: 'String',
        len: 1023,
        discription: 'The reason an audit event was generated. For ' +
            'example “badd password” or “unknown user”. This could also be ' +
            'an error or return code. Example: “0x1234”',
      },
      requestUrl: {
        key: 'request',
        type: 'String',
        len: 1023,
        discription: 'In the case of an HTTP request, this field contains ' +
            'the URL accessed. The URL should contain the protocol as ' +
            'well. Example: “http://www/secure.com”',
      },
      requestClientApplication: {
        key: 'requestClient Application',
        type: 'String',
        len: 1023,
        discription: 'The User-Agent associated with the request.',
      },
      requestContext: {
        key: 'requestContext',
        type: 'String',
        len: 2048,
        discription: 'Description of the content from which the request ' +
            'originated (for example, HTTP Referrer)',
      },
      requestCookies: {
        key: 'requestCookies',
        type: 'String',
        len: 1023,
        discription: 'Cookies associated with the request.',
      },
      requestMethod: {
        key: 'requestMethod',
        type: 'String',
        len: 1023,
        discription: 'The method used to access a URL. Possible values: ' +
            '“POST”, “GET”, etc.',
      },
      deviceReceiptTime: {
        key: 'rt',
        type: 'String',
        len: null,
        discription: 'The time at which the event related to the activity ' +
            'was received. The format is MMM dd yyyy HH:mm:ss or ' +
            'milliseconds since epoch (Jan 1st 1970)',
      },
      sourceHostName: {
        key: 'shost',
        type: 'String',
        len: 1023,
        discription: 'Identifies the source that an event refers to in an ' +
            'IP network. The format should be a fully qualified domain ' +
            'name (DQDN) associated with the source node, when a mode is ' +
            'available. Examples: “host” or “host.domain.com”.',
      },
      sourceMacAddress: {
        key: 'smac',
        type: 'String',
        len: null,
        discription: 'Six colon-separated hexadecimal numbers. Example: ' +
            '“00:0D:60:AF:1B:61”',
      },
      sourceNtDomain: {
        key: 'sntdom',
        type: 'String',
        len: 255,
        discription: 'The Windows domain name for the source address.',
      },
      sourceDnsDomain: {
        key: 'sourceDns Domain',
        type: 'String',
        len: 255,
        discription: 'The DNS domain part of the complete fully qualified ' +
            'domain name (FQDN).',
      },
      sourceServiceName: {
        key: 'source ServiceName',
        type: 'String',
        len: 1023,
        discription: 'The service that is responsible for generating this ' +
            'event.',
      },
      sourceTranslatedAddress: {
        key: 'source Translated Address',
        type: 'String',
        len: null,
        discription: 'Identifies the translated source that the event ' +
            'refers to in an IP network. The format is an IPv4 address. ' +
            'Example: “192.168.10.1”.',
      },
      sourceTranslatedPort: {
        key: 'source TranslatedPort',
        type: 'Number',
        len: null,
        discription: 'A port number after being translated by, for ' +
            'example, a firewall. Valid port numbers are 0 to 65535.',
      },
      sourceProcessId: {
        key: 'spid',
        type: 'Number',
        len: null,
        discription: 'The ID of the source process associated with the ' +
            'event.',
      },
      sourceUserPrivileges: {
        key: 'spriv',
        type: 'String',
        len: 1023,
        discription: 'The typical values are “Administrator”, “User”, and ' +
            '“Guest”. It identifies the source user’s privileges. In UNIX, ' +
            'for example, activity executed by the root user would be ' +
            'identified with “Administrator”.',
      },
      sourceProcessName: {
        key: 'sproc',
        type: 'String',
        len: 1023,
        discription: 'The name of the event’s source process.',
      },
      sourcePort: {
        key: 'spt',
        type: 'Number',
        len: null,
        discription: 'The valid port numbers are 0 to 65535.',
      },
      sourceAddress: {
        key: 'src',
        type: 'String',
        len: null,
        discription: 'Identifies the source that an event refers to in an ' +
            'IP network. The format is an IPv4 address. Example: ' +
            '“192.168.10.1”.',
      },
      startTime: {
        key: 'start',
        type: 'String',
        len: null,
        discription: 'The time when the activity the event referred to ' +
            'started. The format is MMM dd yyyy HH:mm:ss or milliseconds ' +
            'since epoch (Jan 1st 1970)',
      },
      sourceUserId: {
        key: 'suid',
        type: 'String',
        len: 1023,
        discription: 'Identifies the source user by ID. This is the user ' +
            'associated with the source of the event. For example, in ' +
            'UNIX, the root user is generally associated with user ID 0.',
      },
      sourceUserName: {
        key: 'suser',
        type: 'String',
        len: 1023,
        discription: 'Identifies the source user by name. Email addresses ' +
            'are also mapped into the UserName fields. The sender is a ' +
            'candidate to put into this field.',
      },
      type: {
        key: 'type',
        type: 'Number',
        len: null,
        discription: '0 means base event, 1 means aggregated, 2 means ' +
            'correlation, and 3 means action. This field can be omitted ' +
            'for base events (type 0).',
      },
      agentDnsDomain: {
        key: 'agentDns Domain',
        type: 'String',
        len: 255,
        discription: 'The DNS domain name of the ArcSight connector that ' +
            'processed the event.',
      },
      agentNtDomain: {
        key: 'agentNtDomain',
        type: 'String',
        len: 255,
        discription: '',
      },
      agentTranslatedAddress: {
        key: 'agentTranslated Address',
        type: 'String',
        len: null,
        discription: '',
      },
      'agentTranslatedZone ExternalID': {
        key: 'agentTranslated ZoneExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      agentTranslatedZoneURI: {
        key: 'agentTranslated Zone URI',
        type: 'String',
        len: 2048,
        discription: '',
      },
      agentZoneExternalID: {
        key: 'agentZone ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      agentZoneURI: {
        key: 'agentZoneURI',
        type: 'String',
        len: 2048,
        discription: '',
      },
      agentAddress: {
        key: 'agt',
        type: 'String',
        len: null,
        discription: 'The IP address of the ArcSight connector that ' +
            'processed the event.',
      },
      agentHostName: {
        key: 'ahost',
        type: 'String',
        len: 1023,
        discription: 'The hostname of the ArcSight connector that ' +
            'processed the event.',
      },
      agentId: {
        key: 'aid',
        type: 'String',
        len: 40,
        discription: 'The agent ID of the ArcSight connector that ' +
            'processed the event.',
      },
      agentMacAddress: {
        key: 'amac',
        type: 'String',
        len: null,
        discription: 'The MAC address of the ArcSight connector that ' +
            'processed the event.',
      },
      agentReceiptTime: {
        key: 'art',
        type: 'String',
        len: null,
        discription: 'The time at which information about the event was ' +
            'received by the ArcSight connector.',
      },
      agentType: {
        key: 'at',
        type: 'String',
        len: 63,
        discription: 'The agent type of the ArcSight connector that ' +
            'processed the event',
      },
      agentTimeZone: {
        key: 'atz',
        type: 'String',
        len: 255,
        discription: 'The agent time zone of the ArcSight connector that ' +
            'processed the event.',
      },
      agentVersion: {
        key: 'av',
        type: 'String',
        len: 31,
        discription: 'The version of the ArcSight connector that processed ' +
            'the event.',
      },
      customerExternalID: {
        key: 'customer ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      customerURI: {
        key: 'customerURI',
        type: 'String',
        len: 2048,
        discription: '',
      },
      'destinationTranslated ZoneExternalID': {
        key: 'destination TranslatedZone ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      'destinationTranslated ZoneURI': {
        key: 'destination Translated ZoneURI',
        type: 'String',
        len: 2048,
        discription: 'The URI for the Translated Zone that the destination ' +
            'asset has been assigned to in ArcSight.',
      },
      destinationZoneExternalID: {
        key: 'destinationZone ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      destinationZoneURI: {
        key: 'destinationZone URI',
        type: 'String',
        len: 2048,
        discription: 'The URI for the Zone that the destination asset has ' +
            'been assigned to in ArcSight.',
      },
      'deviceTranslatedZone ExternalID': {
        key: 'device TranslatedZone ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      deviceTranslatedZoneURI: {
        key: 'device TranslatedZone URI',
        type: 'String',
        len: 2048,
        discription: 'The URI for the Translated Zone that the device ' +
            'asset has been assigned to in ArcSight.',
      },
      deviceZoneExternalID: {
        key: 'deviceZone ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      deviceZoneURI: {
        key: 'deviceZoneURI',
        type: 'String',
        len: 2048,
        discription: 'Thee URI for the Zone that the device asset has been ' +
            'assigned to in ArcSight.',
      },
      destinationGeoLatitude: {
        key: 'dlat',
        type: 'Number',
        len: null,
        discription: 'The latitudinal value from which the ' +
            'destination’s IP address belongs.',
      },
      destinationGeoLongitude: {
        key: 'dlong',
        type: 'Number',
        len: null,
        discription: 'The longitudinal value from which the destination’s ' +
            'IP address belongs.',
      },
      eventId: {
        key: 'eventId',
        type: 'Number',
        len: null,
        discription: 'This is a unique ID that ArcSight assigns to each ' +
            'event.',
      },
      rawEvent: {
        key: 'rawEvent',
        type: 'String',
        len: 4000,
        discription: '',
      },
      sourceGeoLatitude: {
        key: 'slat',
        type: 'Number',
        len: null,
        discription: '',
      },
      sourceGeoLongitude: {
        key: 'slong',
        type: 'Number',
        len: null,
        discription: '',
      },
      'sourceTranslatedZone ExternalID': {
        key: 'source TranslatedZone ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      sourceTranslatedZoneURI: {
        key: 'source TranslatedZone URI',
        type: 'String',
        len: 2048,
        discription: 'The URI for the Translated Zone that the destination ' +
            'asset has been assigned to in ArcSight.',
      },
      sourceZoneExternalID: {
        key: 'sourceZone ExternalID',
        type: 'String',
        len: 200,
        discription: '',
      },
      sourceZoneURI: {
        key: 'sourceZoneURI',
        type: 'String',
        len: 2048,
        discription: 'The URI for the Zone that the source asset has been ' +
            'assigned to in ArcSight.' },
    };
    if (typeof this.deviceVendor !== 'string'
        || typeof this.deviceProduct !== 'string'
        || typeof this.deviceVersion !== 'string'
    ) {
      throw new Error('TYPE ERROR: CEF Device Info must be a string');
    }
    if (this.severity
        && (
          (
            typeof this.severity === 'string'
            && (
              this.severity !== 'Unknown'
              && this.severity !== 'Low'
              && this.severity !== 'Medium'
              && this.severity !== 'High'
              && this.severity !== 'Very-High'
            )
          )
          || (
            typeof this.severity === 'number'
            && (
              this.severity < 0
              || this.severity > 10
            )
          )
        )
    ) {
      throw new Error('TYPE ERROR: CEF Severity not set correctly');
    }
    const cefExts = Object.entries(this.extensions);
    const cefExtsLen = cefExts.length;
    for (let ext = 0; ext < cefExtsLen; ext++) {
      if (cefExts[ext][1] !== null) {
        if (Extensions[cefExts[ext][0]]) {
          if (typeof cefExts[ext][1] === Extensions[cefExts[ext][0]]
            .type
            .toLowerCase()) {
            if (Extensions[cefExts[ext][0]].len > 0
                && typeof cefExts[ext][1] === 'string'
                && cefExts[ext][1].length > Extensions[cefExts[ext][0]].len){
              let errMsg = 'FORMAT ERROR:';
              errMsg += ' CEF Extention Key';
              errMsg += ' ' + cefExts[ext][0];
              errMsg += ' value length is to long;';
              errMsg += ' max length is';
              errMsg += ' ' + Extensions[cefExts[ext][0]].len;
              throw new Error(errMsg);
            }
          } else {
            let errMsg = 'TYPE ERROR:';
            errMsg += ' CEF Key';
            errMsg += ' ' + cefExts[ext][0];
            errMsg += ' value type was expected to be';
            errMsg += ' ' + Extensions[cefExts[ext][0]].type.toLowerCase();
            throw new Error(errMsg);
          }
        }
      }
    }
    return true;
  }
  /**
   * Build a CEF formatted string
   * @public
   * @return {string} - String with formatted message
   */
  buildMessage() {
    let fmtMsg = 'CEF:0';
    fmtMsg += '|' + this.deviceVendor;
    fmtMsg += '|' + this.deviceProduct;
    fmtMsg += '|' + this.deviceVersion;
    fmtMsg += '|' + this.deviceEventClassId;
    fmtMsg += '|' + this.name;
    fmtMsg += '|' + this.severity;
    fmtMsg += '|';

    const cefExts = Object.entries(this.extensions);
    const cefExtsLen = cefExts.length;
    for (let ext = 0; ext < cefExtsLen; ext++) {
      if (cefExts[ext][1] !== null) {
        fmtMsg += cefExts[ext][0] + '=' + cefExts[ext][1] + ' ';
      }
    }
    return fmtMsg;
  }
  /**
   * @public
   * @param {Syslog} [options=false] - A {@link module:SyslogPro~Syslog|
   *    Syslog server connection} that should be used to send messages directly
   *    from this class. @see SyslogPro~Syslog
   */
  async send(options) {
    const result = this.buildMessage();
    if (!this.server) {
      this.server = new Syslog(options);
    }
    return this.server.send(result);
  }
}

module.exports = {
  RgbToAnsi: rgbToAnsi,
  RFC3164: RFC3164,
  RFC5424: RFC5424,
  LEEF: LEEF,
  CEF: CEF,
  Syslog: Syslog,
};
