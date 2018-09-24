SyslogPro
=========

A pure Javascript Syslog module with support for RFC3164, RFC5424, IBM LEEF (Log Event Extended 
Format), and HP CEF (Common Event Format) formatted messages. SyslogPro has 
transport options of UDP, TCP, and TLS.  TLS includes support for Server and 
Client certificate authrization.  For unformatedm and RFC messages there is 
support for Basic and Extended ANSI coloring. RFC5424 Strucutred Data is also 
encluded in the module.  All 28 standard CEF Extentions are included in the 
defualt CEF class.  All 45 standard LEEF Atrabutes are included in the defualt 
LEEF class. It is the goal of this project is for every relase to offer full 
code covrage unit testing and documentation.

## Installation

  `npm install SyslogPro`

## Usage

    let SyslogPro = require('syslogpro');
    
    let rfc3164Options = {
      
    }
    let rfc5424Options = {
      
    }
    let leefOptions = {
      
    }
    let cefOptions = {
      
    }
    let syslogOptions = {
      
    }
    let syslog = new SyslogPro.Syslog();
    
  
## Tests

  `npm test`

## Contributing

Please try to stay close to the Google JS Style Guid, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.