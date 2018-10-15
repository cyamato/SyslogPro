API
==========================

- back to [README.md](../README.md)

API convention
==

<a name="module_SyslogPro"></a>

## SyslogPro
The SyslogPro module for sending syslog messages
Most APIs will return a promise. These APIs can be used using
`then(...)/catch(...)`

Syslog formatting classes can be used as input into a Syslog class to be used
simultaneously to the same Syslog server.  The Syslog Class with a configured
Syslog server target can also be used as the input into each of the
formatting classes so that they may run independently.

**Version**: 0.1.0  
**Author**: Craig Yamato <craig@kentik.com>  
**Copyright**: (c) 2018 - Craig Yamato  

* [SyslogPro](#module_SyslogPro)
    * [~Syslog](#module_SyslogPro..Syslog)
        * [new Syslog([options])](#new_module_SyslogPro..Syslog_new)
        * [.target](#module_SyslogPro..Syslog+target) : <code>string</code>
        * [.protocol](#module_SyslogPro..Syslog+protocol) : <code>string</code>
        * [.port](#module_SyslogPro..Syslog+port) : <code>number</code>
        * [.tcpTimeout](#module_SyslogPro..Syslog+tcpTimeout) : <code>number</code>
        * [.tlsServerCerts](#module_SyslogPro..Syslog+tlsServerCerts) : <code>Array.&lt;string&gt;</code>
        * [.tlsClientCert](#module_SyslogPro..Syslog+tlsClientCert) : <code>string</code>
        * [.tlsClientKey](#module_SyslogPro..Syslog+tlsClientKey) : <code>string</code>
        * [.format](#module_SyslogPro..Syslog+format) : <code>string</code>
        * [.rfc3164](#module_SyslogPro..Syslog+rfc3164) : <code>RFC3164</code>
        * [.rfc5424](#module_SyslogPro..Syslog+rfc5424) : <code>RFC5424</code>
        * [.leef](#module_SyslogPro..Syslog+leef) : <code>LEEF</code>
        * [.cef](#module_SyslogPro..Syslog+cef) : <code>CEF</code>
    * [~RFC3164](#module_SyslogPro..RFC3164)
        * [new RFC3164([options])](#new_module_SyslogPro..RFC3164_new)
        * [.color](#module_SyslogPro..RFC3164+color) : <code>boolean</code>
        * [.extendedColor](#module_SyslogPro..RFC3164+extendedColor) : <code>boolean</code>
        * [.setColor()](#module_SyslogPro..RFC3164+setColor)
        * [.buildMessage(msg, [options])](#module_SyslogPro..RFC3164+buildMessage) ⇒ <code>Promise</code>
        * [.send(msg, [options])](#module_SyslogPro..RFC3164+send) ⇒ <code>Promise</code>
        * [.emergency(msg)](#module_SyslogPro..RFC3164+emergency) ⇒ <code>Promise</code>
        * [.emer(msg)](#module_SyslogPro..RFC3164+emer) ⇒ <code>Promise</code>
        * [.alert(msg)](#module_SyslogPro..RFC3164+alert) ⇒ <code>Promise</code>
        * [.critical(msg)](#module_SyslogPro..RFC3164+critical) ⇒ <code>Promise</code>
        * [.crit(msg)](#module_SyslogPro..RFC3164+crit) ⇒ <code>Promise</code>
        * [.error(msg)](#module_SyslogPro..RFC3164+error) ⇒ <code>Promise</code>
        * [.err(msg)](#module_SyslogPro..RFC3164+err) ⇒ <code>Promise</code>
        * [.warning(msg)](#module_SyslogPro..RFC3164+warning) ⇒ <code>Promise</code>
        * [.warn(msg)](#module_SyslogPro..RFC3164+warn) ⇒ <code>Promise</code>
        * [.notice(msg)](#module_SyslogPro..RFC3164+notice) ⇒ <code>Promise</code>
        * [.note(msg)](#module_SyslogPro..RFC3164+note) ⇒ <code>Promise</code>
        * [.informational(msg)](#module_SyslogPro..RFC3164+informational) ⇒ <code>Promise</code>
        * [.info(msg)](#module_SyslogPro..RFC3164+info) ⇒ <code>Promise</code>
        * [.log(msg)](#module_SyslogPro..RFC3164+log) ⇒ <code>Promise</code>
        * [.debug(msg)](#module_SyslogPro..RFC3164+debug) ⇒ <code>Promise</code>
    * [~RFC5424](#module_SyslogPro..RFC5424)
        * [new RFC5424([options])](#new_module_SyslogPro..RFC5424_new)
        * [.timestamp](#module_SyslogPro..RFC5424+timestamp) : <code>boolean</code>
        * [.timestampUTC](#module_SyslogPro..RFC5424+timestampUTC) : <code>boolean</code>
        * [.timestampTZ](#module_SyslogPro..RFC5424+timestampTZ) : <code>boolean</code>
        * [.timestampMS](#module_SyslogPro..RFC5424+timestampMS) : <code>boolean</code>
        * [.encludeStructuredData](#module_SyslogPro..RFC5424+encludeStructuredData) : <code>boolean</code>
        * [.utf8BOM](#module_SyslogPro..RFC5424+utf8BOM) : <code>boolean</code>
        * [.color](#module_SyslogPro..RFC5424+color) : <code>boolean</code>
        * [.extendedColor](#module_SyslogPro..RFC5424+extendedColor) : <code>boolean</code>
        * [.setColor()](#module_SyslogPro..RFC5424+setColor)
        * [.buildMessage(msg, [options])](#module_SyslogPro..RFC5424+buildMessage) ⇒ <code>Promise</code>
        * [.send(msg)](#module_SyslogPro..RFC5424+send) ⇒ <code>Promise</code>
        * [.emergency(msg)](#module_SyslogPro..RFC5424+emergency) ⇒ <code>Promise</code>
        * [.emer(msg)](#module_SyslogPro..RFC5424+emer) ⇒ <code>Promise</code>
        * [.alert(msg)](#module_SyslogPro..RFC5424+alert) ⇒ <code>Promise</code>
        * [.critical(msg)](#module_SyslogPro..RFC5424+critical) ⇒ <code>Promise</code>
        * [.crit(msg)](#module_SyslogPro..RFC5424+crit) ⇒ <code>Promise</code>
        * [.error(msg)](#module_SyslogPro..RFC5424+error) ⇒ <code>Promise</code>
        * [.err(msg)](#module_SyslogPro..RFC5424+err) ⇒ <code>Promise</code>
        * [.warning(msg)](#module_SyslogPro..RFC5424+warning) ⇒ <code>Promise</code>
        * [.warn(msg)](#module_SyslogPro..RFC5424+warn) ⇒ <code>Promise</code>
        * [.notice(msg)](#module_SyslogPro..RFC5424+notice) ⇒ <code>Promise</code>
        * [.note(msg)](#module_SyslogPro..RFC5424+note) ⇒ <code>Promise</code>
        * [.informational(msg)](#module_SyslogPro..RFC5424+informational) ⇒ <code>Promise</code>
        * [.info(msg)](#module_SyslogPro..RFC5424+info) ⇒ <code>Promise</code>
        * [.log(msg)](#module_SyslogPro..RFC5424+log) ⇒ <code>Promise</code>
        * [.debug(msg)](#module_SyslogPro..RFC5424+debug) ⇒ <code>Promise</code>
    * [~LEEF](#module_SyslogPro..LEEF)
        * [new LEEF([options])](#new_module_SyslogPro..LEEF_new)
        * [.vendor](#module_SyslogPro..LEEF+vendor) : <code>string</code>
        * [.product](#module_SyslogPro..LEEF+product) : <code>string</code>
        * [.version](#module_SyslogPro..LEEF+version) : <code>string</code>
        * [.eventId](#module_SyslogPro..LEEF+eventId) : <code>string</code>
        * [.syslogHeader](#module_SyslogPro..LEEF+syslogHeader) : <code>boolean</code>
        * [.attributes](#module_SyslogPro..LEEF+attributes) : <code>object</code>
        * [.buildMessage()](#module_SyslogPro..LEEF+buildMessage) ⇒ <code>Promise</code>
        * [.send([options])](#module_SyslogPro..LEEF+send)
    * [~CEF](#module_SyslogPro..CEF)
        * [new CEF([options])](#new_module_SyslogPro..CEF_new)
        * [.deviceVendor](#module_SyslogPro..CEF+deviceVendor) : <code>string</code>
        * [.deviceProduct](#module_SyslogPro..CEF+deviceProduct) : <code>string</code>
        * [.deviceVersion](#module_SyslogPro..CEF+deviceVersion) : <code>string</code>
        * [.deviceEventClassId](#module_SyslogPro..CEF+deviceEventClassId) : <code>string</code>
        * [.name](#module_SyslogPro..CEF+name) : <code>string</code>
        * [.severity](#module_SyslogPro..CEF+severity) : <code>string</code>
        * [.extensions](#module_SyslogPro..CEF+extensions) : <code>object</code>
        * [.validate()](#module_SyslogPro..CEF+validate) ⇒ <code>Promise</code>
        * [.buildMessage()](#module_SyslogPro..CEF+buildMessage) ⇒ <code>Promise</code>
        * [.send([options])](#module_SyslogPro..CEF+send)

<a name="module_SyslogPro..Syslog"></a>

### SyslogPro~Syslog
A class to work with syslog messages using UDP, TCP, or TLS transport.
There is support for Syslog message formatting RFC-3164, RFC-5424 including
Structured Data, IBM LEEF (Log Event Extended Format), and HP CEF (Common
Event Format).
Syslog formatting classes can be used as input into a Syslog class to be used
simultaneously to the same Syslog server. *

**Kind**: inner class of [<code>SyslogPro</code>](#module_SyslogPro)  
**Requires**: <code>module:moment</code>  
**Since**: 0.0.0  
**Version**: 0.0.0  

* [~Syslog](#module_SyslogPro..Syslog)
    * [new Syslog([options])](#new_module_SyslogPro..Syslog_new)
    * [.target](#module_SyslogPro..Syslog+target) : <code>string</code>
    * [.protocol](#module_SyslogPro..Syslog+protocol) : <code>string</code>
    * [.port](#module_SyslogPro..Syslog+port) : <code>number</code>
    * [.tcpTimeout](#module_SyslogPro..Syslog+tcpTimeout) : <code>number</code>
    * [.tlsServerCerts](#module_SyslogPro..Syslog+tlsServerCerts) : <code>Array.&lt;string&gt;</code>
    * [.tlsClientCert](#module_SyslogPro..Syslog+tlsClientCert) : <code>string</code>
    * [.tlsClientKey](#module_SyslogPro..Syslog+tlsClientKey) : <code>string</code>
    * [.format](#module_SyslogPro..Syslog+format) : <code>string</code>
    * [.rfc3164](#module_SyslogPro..Syslog+rfc3164) : <code>RFC3164</code>
    * [.rfc5424](#module_SyslogPro..Syslog+rfc5424) : <code>RFC5424</code>
    * [.leef](#module_SyslogPro..Syslog+leef) : <code>LEEF</code>
    * [.cef](#module_SyslogPro..Syslog+cef) : <code>CEF</code>

<a name="new_module_SyslogPro..Syslog_new"></a>

#### new Syslog([options])
Construct a new Syslog transport object with user options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Options object >>>Transport Configuration |
| [options.target] | <code>string</code> | <code>&quot;&#x27;localhost&#x27;&quot;</code> | The IP Address|FQDN of the    Syslog Server, this option if set will take presidents over any target    set in a formatting object |
| [options.protocol] | <code>string</code> | <code>&quot;&#x27;udp&#x27;&quot;</code> | L4 transport protocol    (udp|tcp|tls), this option if set will take presidents over any    transport set in a formatting object |
| [options.port] | <code>number</code> | <code>514</code> | IP port, this option if set will take    presidents over any IP Port set in a formatting object |
| [options.tcpTimeout] | <code>number</code> | <code>10000</code> | Ignored for all other    transports, this option if set will take presidents over any timeout    set in a formatting object |
| [options.tlsServerCerts] | <code>Array.&lt;string&gt;</code> |  | Array of authorized TLS server    certificates file locations, this option if set will take presidents    over any certificates set in a formatting object |
| [options.tlsClientCert] | <code>string</code> |  | Client TLS certificate file    location that this client should use, this option if set will take    presidents over any certificates set in a formatting object |
| [options.tlsClientKey] | <code>string</code> |  | Client TLS key file    location that this client should use, this option if set will take    presidents over any certificates set in a formatting object >>>Syslog Format Settings |
| [options.format] | <code>string</code> | <code>&quot;&#x27;none&#x27;&quot;</code> | Valid syslog format options for    this module are 'none', 'rfc3164', 'rfc5424', 'leef', 'cef' |
| [options.rfc5424] | <code>RFC3164</code> |  | {@link module:SyslogPro~RFC5424|    RFC5424 related settings} |
| [options.rfc5424] | <code>RFC5424</code> |  | {@link module:SyslogPro~RFC5424|    RFC5424 related settings} |
| [options.leef] | <code>LEEF</code> |  | {@link module:SyslogPro~LEEF|IBM LEEF    (Log Event Extended Format) object} |
| [options.cef] | <code>CEF</code> |  | {@link module:SyslogPro~CEF|HP CEF    (Common Event Format) formatting object} |

<a name="module_SyslogPro..Syslog+target"></a>

#### syslog.target : <code>string</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+protocol"></a>

#### syslog.protocol : <code>string</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+port"></a>

#### syslog.port : <code>number</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+tcpTimeout"></a>

#### syslog.tcpTimeout : <code>number</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+tlsServerCerts"></a>

#### syslog.tlsServerCerts : <code>Array.&lt;string&gt;</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+tlsClientCert"></a>

#### syslog.tlsClientCert : <code>string</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+tlsClientKey"></a>

#### syslog.tlsClientKey : <code>string</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+format"></a>

#### syslog.format : <code>string</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+rfc3164"></a>

#### syslog.rfc3164 : <code>RFC3164</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+rfc5424"></a>

#### syslog.rfc5424 : <code>RFC5424</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+leef"></a>

#### syslog.leef : <code>LEEF</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..Syslog+cef"></a>

#### syslog.cef : <code>CEF</code>
**Kind**: instance property of [<code>Syslog</code>](#module_SyslogPro..Syslog)  
<a name="module_SyslogPro..RFC3164"></a>

### SyslogPro~RFC3164
A class to work with RFC3164 formatted syslog messages. The messaging is
fully configurable and ANSI foreground colors can be added.  Both ANSI 8 and
ANSI 256 color are fully supported. Most APIs will return a promise. These
APIs can be used using `then(...)/catch(...)`

A Syslog class with a configured
Syslog server target can also be used as the input into the formatting
classes so that it may run independently.

The RFC3164 Syslog logging format is meant to be used as a stream of log data
from a service or application. This class is designed to be used in this
fashion where new messages are written to the class as needed.

**Kind**: inner class of [<code>SyslogPro</code>](#module_SyslogPro)  
**Requires**: <code>module:moment</code>  
**Since**: 0.0.0  
**Version**: 0.0.0  

* [~RFC3164](#module_SyslogPro..RFC3164)
    * [new RFC3164([options])](#new_module_SyslogPro..RFC3164_new)
    * [.color](#module_SyslogPro..RFC3164+color) : <code>boolean</code>
    * [.extendedColor](#module_SyslogPro..RFC3164+extendedColor) : <code>boolean</code>
    * [.setColor()](#module_SyslogPro..RFC3164+setColor)
    * [.buildMessage(msg, [options])](#module_SyslogPro..RFC3164+buildMessage) ⇒ <code>Promise</code>
    * [.send(msg, [options])](#module_SyslogPro..RFC3164+send) ⇒ <code>Promise</code>
    * [.emergency(msg)](#module_SyslogPro..RFC3164+emergency) ⇒ <code>Promise</code>
    * [.emer(msg)](#module_SyslogPro..RFC3164+emer) ⇒ <code>Promise</code>
    * [.alert(msg)](#module_SyslogPro..RFC3164+alert) ⇒ <code>Promise</code>
    * [.critical(msg)](#module_SyslogPro..RFC3164+critical) ⇒ <code>Promise</code>
    * [.crit(msg)](#module_SyslogPro..RFC3164+crit) ⇒ <code>Promise</code>
    * [.error(msg)](#module_SyslogPro..RFC3164+error) ⇒ <code>Promise</code>
    * [.err(msg)](#module_SyslogPro..RFC3164+err) ⇒ <code>Promise</code>
    * [.warning(msg)](#module_SyslogPro..RFC3164+warning) ⇒ <code>Promise</code>
    * [.warn(msg)](#module_SyslogPro..RFC3164+warn) ⇒ <code>Promise</code>
    * [.notice(msg)](#module_SyslogPro..RFC3164+notice) ⇒ <code>Promise</code>
    * [.note(msg)](#module_SyslogPro..RFC3164+note) ⇒ <code>Promise</code>
    * [.informational(msg)](#module_SyslogPro..RFC3164+informational) ⇒ <code>Promise</code>
    * [.info(msg)](#module_SyslogPro..RFC3164+info) ⇒ <code>Promise</code>
    * [.log(msg)](#module_SyslogPro..RFC3164+log) ⇒ <code>Promise</code>
    * [.debug(msg)](#module_SyslogPro..RFC3164+debug) ⇒ <code>Promise</code>

<a name="new_module_SyslogPro..RFC3164_new"></a>

#### new RFC3164([options])
Construct a new RFC3164 formatted Syslog object with user options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Options object |
| [options.applacationName] | <code>string</code> | <code>&quot;&#x27;NodeJSLogger&#x27;&quot;</code> | Application |
| [options.hostname] | <code>string</code> | <code>&quot;os.hostname&quot;</code> | The name of this server |
| [options.facility] | <code>number</code> | <code>23</code> | Facility code to use sending this    message |
| [options.color] | <code>boolean</code> | <code>false</code> | Apply color coding encoding tag    with syslog message text |
| [options.extendedColor] | <code>boolean</code> | <code>false</code> | Use the extended ANSI    color set encoding tag with syslog message text |
| [options.colors] | <code>object</code> |  | User defended colors for    severities |
| [options.colors.emergencyColor] | <code>string</code> |  | A RGB Hex coded color in    the form of #FFFFFF or as or the ANSI color code number (30-37 Standard    & 0-255 Extended) |
| [options.colors.alertColor] | <code>string</code> |  | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [options.colors.criticalColor] | <code>string</code> |  | A RGB Hex coded color in    the form of #FFFFFF or as or the ANSI color code number (30-37 Standard    & 0-255 Extended) |
| [options.colors.errorColor] | <code>string</code> |  | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [options.colors.warningColor] | <code>string</code> |  | A RGB Hex coded color in    the form of #FFFFFF or as or the ANSI color code number (30-37 Standard     & 0-255 Extended) |
| [options.colors.noticeColor] | <code>string</code> |  | A RGB Hex coded color in the     form of #FFFFFF or as or the ANSI color code number (30-37 Standard &     0-255 Extended) |
| [options.colors.informationalColor] | <code>string</code> |  | A RGB Hex coded color    in the form of #FFFFFF or as or the ANSI color code number (30-37    Standard & 0-255 Extended) |
| [options.colors.debugColor] | <code>string</code> |  | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [options.server] | <code>Syslog</code> | <code>false</code> | A {@link module:SyslogPro~Syslog|    Syslog server connection} that should be used to send messages directly    from this class. @see SyslogPro~Syslog |

<a name="module_SyslogPro..RFC3164+color"></a>

#### rfC3164.color : <code>boolean</code>
**Kind**: instance property of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
<a name="module_SyslogPro..RFC3164+extendedColor"></a>

#### rfC3164.extendedColor : <code>boolean</code>
**Kind**: instance property of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
<a name="module_SyslogPro..RFC3164+setColor"></a>

#### rfC3164.setColor()
Sets the color to be used for messages at a set priority

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Throws**:

- <code>Error</code> A standard error object

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| [colors.emergencyColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.alertColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.criticalColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.errorColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.warningColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.noticeColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.informationalColor] | <code>string</code> | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [colors.debugColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |

<a name="module_SyslogPro..RFC3164+buildMessage"></a>

#### rfC3164.buildMessage(msg, [options]) ⇒ <code>Promise</code>
Building a formatted message.  Returns a promise with a formatted message

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - A Syslog formatted string according to the selected RFC  
**Throws**:

- <code>Error</code> A standard error object

**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| msg | <code>string</code> |  | The Syslog Message |
| [options] | <code>object</code> |  | Options object |
| [options.severity] | <code>number</code> | <code>7</code> | An array of structure |
| [options.colorCode] | <code>number</code> | <code>36</code> | The ANSI color code to use if    message coloration is selected |

<a name="module_SyslogPro..RFC3164+send"></a>

#### rfC3164.send(msg, [options]) ⇒ <code>Promise</code>
send a RFC5424 formatted message.  Returns a promise with the formatted
   message that was sent.  If no server connection was defined when the
   class was created a default Syslog connector will be used.

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - A Syslog formatted string according to the selected RFC  
**Throws**:

- <code>Error</code> A standard error object

**Access**: public  
**See**: SyslogPro~Syslog  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| msg | <code>string</code> |  | The unformatted Syslog message to send |
| [options] | <code>object</code> |  | Options object |
| [options.severity] | <code>number</code> | <code>7</code> | An array of structure |
| [options.colorCode] | <code>number</code> | <code>36</code> | The ANSI color code to use if |

<a name="module_SyslogPro..RFC3164+emergency"></a>

#### rfC3164.emergency(msg) ⇒ <code>Promise</code>
Send a syslog message with a security level of 0 (Emergency)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The emergency message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+emer"></a>

#### rfC3164.emer(msg) ⇒ <code>Promise</code>
Send a syslog message with a security level of 0 (Emergency)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The emergency message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+alert"></a>

#### rfC3164.alert(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 1 (Alert)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The alert message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+critical"></a>

#### rfC3164.critical(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 2 (Critical)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The critical message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+crit"></a>

#### rfC3164.crit(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 2 (Critical)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The critical message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+error"></a>

#### rfC3164.error(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 3 (Error)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The error message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+err"></a>

#### rfC3164.err(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 3 (Error)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The error message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+warning"></a>

#### rfC3164.warning(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 4 (Warning)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The warning message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+warn"></a>

#### rfC3164.warn(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 4 (Warning)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The warning message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+notice"></a>

#### rfC3164.notice(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 5 (Notice)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The notice message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+note"></a>

#### rfC3164.note(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 5 (Notice)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The notice message to send to the Syslog server |

<a name="module_SyslogPro..RFC3164+informational"></a>

#### rfC3164.informational(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 6 (Informational)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The informational message to send to the Syslog    server |

<a name="module_SyslogPro..RFC3164+info"></a>

#### rfC3164.info(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 6 (Informational)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The informational message to send to the Syslog    server |

<a name="module_SyslogPro..RFC3164+log"></a>

#### rfC3164.log(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 6 (Informational)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The informational message to send to the Syslog    server |

<a name="module_SyslogPro..RFC3164+debug"></a>

#### rfC3164.debug(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 7 (Debug)

**Kind**: instance method of [<code>RFC3164</code>](#module_SyslogPro..RFC3164)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The debug message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424"></a>

### SyslogPro~RFC5424
A class to work with RFC5424 formatted syslog messages. The messaging is
fully configurable and ANSI foreground  * colors can be added.  Both ANSI 8
and ANSI 256 color are fully supported.
Most APIs will return a promise. These APIs can be used using
`then(...)/catch(...)`

A Syslog class with a configured
Syslog server target can also be used as the input into the formatting
classes so that it may run independently.

The RFC5424 Syslog logging format is meant to be used as a stream of log data
from a service or application. This class is designed to be used in this
fashion where new messages are written to the class as needed.

**Kind**: inner class of [<code>SyslogPro</code>](#module_SyslogPro)  
**Requires**: <code>module:moment</code>  
**Since**: 0.0.0  
**Version**: 0.0.0  

* [~RFC5424](#module_SyslogPro..RFC5424)
    * [new RFC5424([options])](#new_module_SyslogPro..RFC5424_new)
    * [.timestamp](#module_SyslogPro..RFC5424+timestamp) : <code>boolean</code>
    * [.timestampUTC](#module_SyslogPro..RFC5424+timestampUTC) : <code>boolean</code>
    * [.timestampTZ](#module_SyslogPro..RFC5424+timestampTZ) : <code>boolean</code>
    * [.timestampMS](#module_SyslogPro..RFC5424+timestampMS) : <code>boolean</code>
    * [.encludeStructuredData](#module_SyslogPro..RFC5424+encludeStructuredData) : <code>boolean</code>
    * [.utf8BOM](#module_SyslogPro..RFC5424+utf8BOM) : <code>boolean</code>
    * [.color](#module_SyslogPro..RFC5424+color) : <code>boolean</code>
    * [.extendedColor](#module_SyslogPro..RFC5424+extendedColor) : <code>boolean</code>
    * [.setColor()](#module_SyslogPro..RFC5424+setColor)
    * [.buildMessage(msg, [options])](#module_SyslogPro..RFC5424+buildMessage) ⇒ <code>Promise</code>
    * [.send(msg)](#module_SyslogPro..RFC5424+send) ⇒ <code>Promise</code>
    * [.emergency(msg)](#module_SyslogPro..RFC5424+emergency) ⇒ <code>Promise</code>
    * [.emer(msg)](#module_SyslogPro..RFC5424+emer) ⇒ <code>Promise</code>
    * [.alert(msg)](#module_SyslogPro..RFC5424+alert) ⇒ <code>Promise</code>
    * [.critical(msg)](#module_SyslogPro..RFC5424+critical) ⇒ <code>Promise</code>
    * [.crit(msg)](#module_SyslogPro..RFC5424+crit) ⇒ <code>Promise</code>
    * [.error(msg)](#module_SyslogPro..RFC5424+error) ⇒ <code>Promise</code>
    * [.err(msg)](#module_SyslogPro..RFC5424+err) ⇒ <code>Promise</code>
    * [.warning(msg)](#module_SyslogPro..RFC5424+warning) ⇒ <code>Promise</code>
    * [.warn(msg)](#module_SyslogPro..RFC5424+warn) ⇒ <code>Promise</code>
    * [.notice(msg)](#module_SyslogPro..RFC5424+notice) ⇒ <code>Promise</code>
    * [.note(msg)](#module_SyslogPro..RFC5424+note) ⇒ <code>Promise</code>
    * [.informational(msg)](#module_SyslogPro..RFC5424+informational) ⇒ <code>Promise</code>
    * [.info(msg)](#module_SyslogPro..RFC5424+info) ⇒ <code>Promise</code>
    * [.log(msg)](#module_SyslogPro..RFC5424+log) ⇒ <code>Promise</code>
    * [.debug(msg)](#module_SyslogPro..RFC5424+debug) ⇒ <code>Promise</code>

<a name="new_module_SyslogPro..RFC5424_new"></a>

#### new RFC5424([options])
Construct a new RFC5424 formatted Syslog object with user options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Options object |
| [options.applacationName] | <code>string</code> | <code>&quot;&#x27;NodeJSLogger&#x27;&quot;</code> | Application |
| [options.hostname] | <code>string</code> | <code>&quot;os.hostname&quot;</code> | The name of this server |
| [options.timestamp] | <code>boolean</code> | <code>false</code> | Included a Timestamp |
| [options.timestampUTC] | <code>boolean</code> | <code>false</code> | RFC standard is for    local time |
| [options.timestampMS] | <code>boolean</code> | <code>false</code> | Timestamp with ms    resolution |
| [options.timestampTZ] | <code>boolean</code> | <code>true</code> | Should the timestamp    included time zone |
| [options.encludeStructuredData] | <code>boolean</code> | <code>false</code> | Included    any provided structured data |
| [options.utf8BOM] | <code>boolean</code> | <code>true</code> | Included the UTF8 |
| [options.color] | <code>boolean</code> | <code>false</code> | Included the UTF8 |
| [options.extendedColor] | <code>boolean</code> | <code>false</code> | Included the UTF8    encoding tag with syslog message text |
| [options.colors] | <code>object</code> |  | User defended colors for    severities |
| [options.colors.emergencyColor] | <code>string</code> |  | A RGB Hex coded color in    the form of #FFFFFF or as or the ANSI color code number (30-37 Standard    & 0-255 Extended) |
| [options.colors.alertColor] | <code>string</code> |  | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [options.colors.criticalColor] | <code>string</code> |  | A RGB Hex coded color in    the form of #FFFFFF or as or the ANSI color code number (30-37 Standard    & 0-255 Extended) |
| [options.colors.errorColor] | <code>string</code> |  | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [options.colors.warningColor] | <code>string</code> |  | A RGB Hex coded color in    the form of #FFFFFF or as or the ANSI color code number (30-37 Standard    & 0-255 Extended) |
| [options.colors.noticeColor] | <code>string</code> |  | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [options.colors.informationalColor] | <code>string</code> |  | A RGB Hex coded color    in the form of #FFFFFF or as or the ANSI color code number (30-37    Standard & 0-255 Extended) |
| [options.colors.debugColor] | <code>string</code> |  | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [options.server] | <code>Syslog</code> | <code>false</code> | A {@link module:SyslogPro~Syslog|    Syslog server connection} that should be used to send messages directly    from this class. @see SyslogPro~Syslog |

<a name="module_SyslogPro..RFC5424+timestamp"></a>

#### rfC5424.timestamp : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+timestampUTC"></a>

#### rfC5424.timestampUTC : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+timestampTZ"></a>

#### rfC5424.timestampTZ : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+timestampMS"></a>

#### rfC5424.timestampMS : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+encludeStructuredData"></a>

#### rfC5424.encludeStructuredData : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+utf8BOM"></a>

#### rfC5424.utf8BOM : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+color"></a>

#### rfC5424.color : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+extendedColor"></a>

#### rfC5424.extendedColor : <code>boolean</code>
**Kind**: instance property of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
<a name="module_SyslogPro..RFC5424+setColor"></a>

#### rfC5424.setColor()
Sets the color to be used for messages at a set priority

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Throws**:

- <code>Error</code> A standard error object

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| [colors.emergencyColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.alertColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.criticalColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.errorColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.warningColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.noticeColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |
| [colors.informationalColor] | <code>string</code> | A RGB Hex coded color in the    form of #FFFFFF or as or the ANSI color code number (30-37 Standard &    0-255 Extended) |
| [colors.debugColor] | <code>string</code> | A RGB Hex coded color in the form    of #FFFFFF or as or the ANSI color code number (30-37 Standard & 0-255    Extended) |

<a name="module_SyslogPro..RFC5424+buildMessage"></a>

#### rfC5424.buildMessage(msg, [options]) ⇒ <code>Promise</code>
Building a formatted message.  Returns a promise with a formatted message

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - A Syslog formatted string according to the selected RFC  
**Throws**:

- <code>Error</code> A standard error object

**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| msg | <code>string</code> |  | The Syslog Message |
| [options] | <code>object</code> |  | Options object |
| [options.severity] | <code>number</code> | <code>7</code> | An array of structure |
| [options.facility] | <code>number</code> | <code>23</code> | Facility code to use sending this    message |
| [options.pid] | <code>string</code> | <code>&quot;&#x27;-&#x27;&quot;</code> | The process id of the service sending    this message |
| [options.structuredData] | <code>Array.&lt;string&gt;</code> |  | An array of structure    data strings conforming to the IETF/IANA defined SD-IDs or IANA    registered SMI Network Management Private Enterprise Code SD-ID    conforming to the format    [name@<private enterprise number> parameter=value] |
| [options.colorCode] | <code>number</code> | <code>36</code> | The ANSI color code to use if    message coloration is selected |

<a name="module_SyslogPro..RFC5424+send"></a>

#### rfC5424.send(msg) ⇒ <code>Promise</code>
send a RFC5424 formatted message.  Returns a promise with the formatted
   message that was sent.  If no server connection was defined when the
   class was created a default Syslog connector will be used.

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - A Syslog formatted string according to the selected RFC  
**Throws**:

- <code>Error</code> A standard error object

**Access**: public  
**See**: SyslogPro~Syslog  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The unformatted Syslog message to send |

<a name="module_SyslogPro..RFC5424+emergency"></a>

#### rfC5424.emergency(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 0 (Emergency)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The emergency message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+emer"></a>

#### rfC5424.emer(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 0 (Emergency)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The emergency message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+alert"></a>

#### rfC5424.alert(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 1 (Alert)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The alert message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+critical"></a>

#### rfC5424.critical(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 2 (Critical)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The critical message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+crit"></a>

#### rfC5424.crit(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 2 (Critical)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The critical message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+error"></a>

#### rfC5424.error(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 3 (Error)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The error message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+err"></a>

#### rfC5424.err(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 3 (Error)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The error message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+warning"></a>

#### rfC5424.warning(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 4 (Warning)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The warning message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+warn"></a>

#### rfC5424.warn(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 4 (Warning)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The warning message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+notice"></a>

#### rfC5424.notice(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 5 (Notice)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The notice message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+note"></a>

#### rfC5424.note(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 5 (Notice)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The notice message to send to the Syslog server |

<a name="module_SyslogPro..RFC5424+informational"></a>

#### rfC5424.informational(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 6 (Informational)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The informational message to send to the Syslog    server |

<a name="module_SyslogPro..RFC5424+info"></a>

#### rfC5424.info(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 6 (Informational)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The informational message to send to the Syslog    server |

<a name="module_SyslogPro..RFC5424+log"></a>

#### rfC5424.log(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 6 (Informational)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The informational message to send to the Syslog    server |

<a name="module_SyslogPro..RFC5424+debug"></a>

#### rfC5424.debug(msg) ⇒ <code>Promise</code>
Send a syslog message with a severity level of 7 (Debug)

**Kind**: instance method of [<code>RFC5424</code>](#module_SyslogPro..RFC5424)  
**Returns**: <code>Promise</code> - - The formatted syslog message sent to the Syslog server  
**Throws**:

- <code>Error</code> - Any bubbled-up error

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The debug message to send to the Syslog server |

<a name="module_SyslogPro..LEEF"></a>

### SyslogPro~LEEF
A class to work with IBM LEEF (Log Event Extended Format) messages this form
of system messages are designed to work with security systems.  Messages can
be saved to file (Saving to file if not part of this module but a LEEF
formatted message produced by this module can be saved externally to it) or
sent via Syslog.
Most APIs will return a promise. These APIs can be used using
`then(...)/catch(...)`

A Syslog class with a configured Syslog server target can also be used as
the input into the formatting classes so that it may run independently. The
LEEF format is designed to send event data to a SIEM system and should not
be as a logging stream. This class is meant to be used once per message.

**Kind**: inner class of [<code>SyslogPro</code>](#module_SyslogPro)  
**Requires**: <code>module:moment</code>  
**Since**: 0.0.0  
**Version**: 0.0.0  

* [~LEEF](#module_SyslogPro..LEEF)
    * [new LEEF([options])](#new_module_SyslogPro..LEEF_new)
    * [.vendor](#module_SyslogPro..LEEF+vendor) : <code>string</code>
    * [.product](#module_SyslogPro..LEEF+product) : <code>string</code>
    * [.version](#module_SyslogPro..LEEF+version) : <code>string</code>
    * [.eventId](#module_SyslogPro..LEEF+eventId) : <code>string</code>
    * [.syslogHeader](#module_SyslogPro..LEEF+syslogHeader) : <code>boolean</code>
    * [.attributes](#module_SyslogPro..LEEF+attributes) : <code>object</code>
    * [.buildMessage()](#module_SyslogPro..LEEF+buildMessage) ⇒ <code>Promise</code>
    * [.send([options])](#module_SyslogPro..LEEF+send)

<a name="new_module_SyslogPro..LEEF_new"></a>

#### new LEEF([options])
Construct a new LEEF formatting object with user options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Options object |
| [options.vendor] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The vendor of the system that    generated the event being reported |
| [options.product] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The product name of the    system that genrated the event being reported |
| [options.version] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The version name of the    system that genrated the event being reported |
| [options.eventId] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The eventId of the    system that genrated the event being reported |
| [options.attributes] | <code>object</code> |  | LEEF message attributes which    defaults to all base attributes with null values, new attributes should    be added as new elements to this object |
| [options.syslogHeader] | <code>boolean</code> | <code>&#x27;true&#x27;</code> | Should the LEEF message    include a Syslog header with Timestamp and source |
| [options.server] | <code>Syslog</code> | <code>false</code> | A {@link module:SyslogPro~Syslog|    Syslog server connection} that should be used to send messages directly    from this class. @see SyslogPro~Syslog |

<a name="module_SyslogPro..LEEF+vendor"></a>

#### leeF.vendor : <code>string</code>
**Kind**: instance property of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
<a name="module_SyslogPro..LEEF+product"></a>

#### leeF.product : <code>string</code>
**Kind**: instance property of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
<a name="module_SyslogPro..LEEF+version"></a>

#### leeF.version : <code>string</code>
**Kind**: instance property of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
<a name="module_SyslogPro..LEEF+eventId"></a>

#### leeF.eventId : <code>string</code>
**Kind**: instance property of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
<a name="module_SyslogPro..LEEF+syslogHeader"></a>

#### leeF.syslogHeader : <code>boolean</code>
**Kind**: instance property of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
<a name="module_SyslogPro..LEEF+attributes"></a>

#### leeF.attributes : <code>object</code>
**Kind**: instance property of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
<a name="module_SyslogPro..LEEF+buildMessage"></a>

#### leeF.buildMessage() ⇒ <code>Promise</code>
Build a formatted message

**Kind**: instance method of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
**Returns**: <code>Promise</code> - - string with formatted message  
**Access**: public  
<a name="module_SyslogPro..LEEF+send"></a>

#### leeF.send([options])
**Kind**: instance method of [<code>LEEF</code>](#module_SyslogPro..LEEF)  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Syslog</code> | <code>false</code> | A {@link module:SyslogPro~Syslog|    Syslog server connection} that should be used to send messages directly    from this class. @see SyslogPro~Syslog |

<a name="module_SyslogPro..CEF"></a>

### SyslogPro~CEF
A class to work with HP CEF (Common Event Format) messages. This form
of system messages are designed to work with security systems.  Messages can
be saved to file (Saving to file if not part of this module but a CEF
formatted message produced by this module can be saved externally to it) or
sent via Syslog.
Most APIs will return a promise. These APIs can be used using
`then(...)/catch(...)`

A Syslog class with a configured Syslog server target can also be used as
the input into the formatting classes so that it may run independently. The
CEF format is designed to send event data to a SIEM system and should not be
as a logging stream. This class is meant to be used once per message.

**Kind**: inner class of [<code>SyslogPro</code>](#module_SyslogPro)  
**Requires**: <code>module:moment</code>  
**Since**: 0.0.0  
**Version**: 0.0.0  

* [~CEF](#module_SyslogPro..CEF)
    * [new CEF([options])](#new_module_SyslogPro..CEF_new)
    * [.deviceVendor](#module_SyslogPro..CEF+deviceVendor) : <code>string</code>
    * [.deviceProduct](#module_SyslogPro..CEF+deviceProduct) : <code>string</code>
    * [.deviceVersion](#module_SyslogPro..CEF+deviceVersion) : <code>string</code>
    * [.deviceEventClassId](#module_SyslogPro..CEF+deviceEventClassId) : <code>string</code>
    * [.name](#module_SyslogPro..CEF+name) : <code>string</code>
    * [.severity](#module_SyslogPro..CEF+severity) : <code>string</code>
    * [.extensions](#module_SyslogPro..CEF+extensions) : <code>object</code>
    * [.validate()](#module_SyslogPro..CEF+validate) ⇒ <code>Promise</code>
    * [.buildMessage()](#module_SyslogPro..CEF+buildMessage) ⇒ <code>Promise</code>
    * [.send([options])](#module_SyslogPro..CEF+send)

<a name="new_module_SyslogPro..CEF_new"></a>

#### new CEF([options])
Construct a new CEF formatting object with user options


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  | Options object |
| [options.deviceVendor] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The vendor of the system    that generated the event being reported |
| [options.deviceProduct] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The product name of the    system that genrated the event being reported |
| [options.deviceVersion] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The version name of the    system that genrated the event being reported |
| [options.deviceEventClassId] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | The eventId of the    system that genrated the event being reported |
| [options.name] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | Name of the service generating    the notice |
| [options.severity] | <code>string</code> | <code>&quot;&#x27;unknown&#x27;&quot;</code> | Severity of the notification |
| [options.extensions] | <code>string</code> | <code>&quot;{}&quot;</code> | Any CEF Key=Value extensions |
| [options.server] | <code>Syslog</code> | <code>false</code> | A {@link module:SyslogPro~Syslog|    Syslog server connection} that should be used to send messages directly    from this class. @see SyslogPro~Syslog |

<a name="module_SyslogPro..CEF+deviceVendor"></a>

#### ceF.deviceVendor : <code>string</code>
**Kind**: instance property of [<code>CEF</code>](#module_SyslogPro..CEF)  
<a name="module_SyslogPro..CEF+deviceProduct"></a>

#### ceF.deviceProduct : <code>string</code>
**Kind**: instance property of [<code>CEF</code>](#module_SyslogPro..CEF)  
<a name="module_SyslogPro..CEF+deviceVersion"></a>

#### ceF.deviceVersion : <code>string</code>
**Kind**: instance property of [<code>CEF</code>](#module_SyslogPro..CEF)  
<a name="module_SyslogPro..CEF+deviceEventClassId"></a>

#### ceF.deviceEventClassId : <code>string</code>
**Kind**: instance property of [<code>CEF</code>](#module_SyslogPro..CEF)  
<a name="module_SyslogPro..CEF+name"></a>

#### ceF.name : <code>string</code>
**Kind**: instance property of [<code>CEF</code>](#module_SyslogPro..CEF)  
<a name="module_SyslogPro..CEF+severity"></a>

#### ceF.severity : <code>string</code>
**Kind**: instance property of [<code>CEF</code>](#module_SyslogPro..CEF)  
<a name="module_SyslogPro..CEF+extensions"></a>

#### ceF.extensions : <code>object</code>
**Kind**: instance property of [<code>CEF</code>](#module_SyslogPro..CEF)  
<a name="module_SyslogPro..CEF+validate"></a>

#### ceF.validate() ⇒ <code>Promise</code>
Validate this CEF object

**Kind**: instance method of [<code>CEF</code>](#module_SyslogPro..CEF)  
**Returns**: <code>Promise</code> - - True if validated  
**Throws**:

- <code>Error</code> - First element to fail validation

**Access**: public  
<a name="module_SyslogPro..CEF+buildMessage"></a>

#### ceF.buildMessage() ⇒ <code>Promise</code>
Build a CEF formated string

**Kind**: instance method of [<code>CEF</code>](#module_SyslogPro..CEF)  
**Returns**: <code>Promise</code> - - String with formated message  
**Access**: public  
<a name="module_SyslogPro..CEF+send"></a>

#### ceF.send([options])
**Kind**: instance method of [<code>CEF</code>](#module_SyslogPro..CEF)  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Syslog</code> | <code>false</code> | A {@link module:SyslogPro~Syslog|    Syslog server connection} that should be used to send messages directly    from this class. @see SyslogPro~Syslog |


*docs autogenerated via [jsdoc2md]
(https://github.com/jsdoc2md/jsdoc-to-markdown)*

## Test
```shell
  npm test
```

## Contributing

Please try to maintain the existing coding style. Add unit tests for any new or 
changed functionality. Lint and test your code.
