SyslogPro
=========
[![Build Status](https://travis-ci.org/cyamato/SyslogPro.svg?branch=master)](https://travis-ci.org/cyamato/SyslogPro) [![Coverage Status](https://coveralls.io/repos/github/cyamato/SyslogPro/badge.svg?branch=master)](https://coveralls.io/github/cyamato/SyslogPro?branch=master)

A pure Javascript Syslog module with support for RFC3164, RFC5424, IBM LEEF 
(Log Event Extended Format), and HP CEF (Common Event Format) formatted 
messages. SyslogPro has transport options of UDP, TCP, and TLS.  TLS includes 
support for Server and Client certificate authrization.  For unformatedm and 
RFC messages there is support for Basic and Extended ANSI coloring. RFC5424 
Strucutred Data is also encluded in the module.  All 28 standard CEF Extentions 
are included in the defualt CEF class.  All 45 standard LEEF Atrabutes are 
included in the defualt LEEF class. It is the goal of this project is for every 
relase to offer full code covrage unit testing and documentation. [Please see
the full documation for usage and options:  https://cyamato.github.io/SyslogPro/](https://cyamato.github.io/SyslogPro/).

## Installation

  `npm install SyslogPro`

## Usage

    const SyslogPro = require('syslogpro');
    
    let syslog = new SyslogPro.Syslog({
      target: 'localhost',
      protocol: 'udp',
      format: 'rfc5424'
    });
    
    syslog.rfc5424.info('My Message');
    
    // Optionaly you can create each class or class options to pass to SyslogPro
    // to create formated messages or use directly
    
    let rfc3164 = new SyslogPro.RFC3164({
      applacationName: 'MyApp',
      color: true,
      extendedColor: true,
      server: {
        target: 'myServer.fqdn'
      }
    });
    
    rfc3164.info('My Message');
    
    let rfc5424 = new SyslogPro.RFC5424({
      applacationName: 'MyApp',
      timestamp: true,
      encludeStructuredData: true
      color: true,
      extendedColor: true,
      server: {
        target: 'myServer.fqdn'
      }
    });
    
    rfc5424.info('My Message');
    
    let leef = new SyslogPro.LEEF({
      vendor: 'acme',
      product: 'doohickey1000',
      version: 'alpha',
      eventId: 'hack',
      attrabutes: {
        cat: 'CC Databreach'
      },
      server: {
        target: 'myServer.fqdn'
      }
    })
        .send()
            .then((result) => {})
            .catch((error) => {
              console.log(error);
            });
    
    let cef = new SyslogPro.CEF({
      deviceVendor: 'acme',
      deviceProduct: 'doohickey1000',
      deviceVersion: 'alpha',
      deviceEventClassId: 'hack',
      name: 'My Reporting Service',
      severity: 'High',
      extensions: {
        rawEvent: 'CC Databreach'
      },
      server: {
        target: 'myServer.fqdn'
      }
    })
        .send()
            .then((result) => {})
            .catch((error) => {
              console.log(error);
            });
  
## Tests

  `npm test`

## Contributing

Please try to stay close to the Google JS Style Guid, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.