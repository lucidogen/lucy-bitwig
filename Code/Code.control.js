/* Lucidogen's version of Bitwig Studio control with Livid Code
 * ------------------------------------------------------------
 *
 * Goals
 * -----
 *  Our goal with this script is to enable "eyes-less" control of effects
 *  and plugins.
 *
 * How it works
 * ------------
 *
 *  8 first macro on track
 *  ----------------------
 *
 *  When selecting a track in Bitwig Studio, the first 8 Macro settings are
 *  mapped to the first 8 encoders on the Code:
 *      +---------------------+
 *      |  O x x x x . . . .  |
 *      |  O x x x x . . . .  |
 *      |  O . . . . . . . .  |
 *      |  O . . . . . . . .  |
 *      |  O O O O O O O O O  |
 *      +---------------------+
 *  
 * We need to set Livid Code to defaults,
 * enc speed A = 1x
 * enc speed B = 1/4x
 * top left button momentary enc speed
 */
loadAPI (1)

var VERSION = '1.0'

// Number of controls watched on selected track
var STRACK_CONTROLS_COUNT = 8
var RESOLUTION = 128
var MACROS   = []
// Bitwig macro layout
var BW_MACROS =
[  1,  2,  3,  4,   17, 18, 19, 20
,  5,  6,  7,  8,   21, 22, 23, 24

,  9, 10, 11, 12,   25, 26, 27, 28
, 13, 14, 15, 16,   29, 30, 31, 32
]
// We use default mapping for simplification
var LIVID_CODE =
[  1,  5,  9, 13,   17, 21, 25, 29
,  2,  6, 10, 14,   18, 22, 26, 30

,  3,  7, 11, 15,   19, 23, 27, 31
,  4,  8, 12, 16,   20, 24, 28, 32
]

var CTRL_TO_MAC = []
var MAC_TO_CTRL = []
for ( var i = 0; i < BW_MACROS.length; ++i )
{ var ctrl = LIVID_CODE [ i ]
  var mac  = BW_MACROS  [ i ]
  CTRL_TO_MAC [ ctrl ] = mac
  MAC_TO_CTRL [ mac  ] = ctrl
}
  

// set properties
host.defineController
( 'Lucidogen', 'Code', '1.0', '2f722a80-d8cb-11e5-a837-0800200c9a66' )

host.defineMidiPorts ( 1, 1 )

function init ()
{ // Set MIDI callbacks
  host.getMidiInPort ( 0 )
  .setMidiCallback ( onMidi )

  midiOut =
  host.getMidiOutPort ( 0 )

  // Selected track
  var strack =
  host.createArrangerCursorTrack ( 2, 0 )

  // Devices of selected track
  var sdevices =
  strack.createDeviceBank ( STRACK_CONTROLS_COUNT )

  // First device in selected track
  var firstDevice = sdevices.getDevice ( 0 )

  function setupMacro ( mac )
  { var macro = firstDevice.getMacro ( mac - 1 ).getAmount ()
    var ctrl  = MAC_TO_CTRL [ mac ]
    macro.addValueObserver
    ( RESOLUTION, function ( value )
      { // channel 1, cc, value
        midiOut.sendMidi ( 0xB0, ctrl, value )
      }
    )
    macro.setIndication ( true )
    MACROS [ mac ] = macro
  }

  for ( var i = 1; i <= STRACK_CONTROLS_COUNT; ++i )
  { setupMacro ( i )
  }

  println ( 'Lucidogen Code v ' + VERSION + ' setup completed.')
}

function onMidi ( status, data1, data2 )
{
  if ( isChannelController ( status ) )
  { var mac = CTRL_TO_MAC [ data1 ]
    if ( mac )
    { var m = MACROS [ mac ]
      if ( m )
      { m.set ( data2, RESOLUTION )
      }
    }
  }
}
