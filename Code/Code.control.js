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
 *  Macro of first 3 devices in selected track
 *  ------------------------------------------
 *
 *  When selecting a track in Bitwig Studio, the 8 Macro settings are
 *  mapped to the first 8 encoders on the Code:
 *      +---------------------+
 *      |  O 1 1 1 1 2 2 2 2  |
 *      |  O 1 1 1 1 2 2 2 2  |
 *      |  O 3 3 3 3 . . . .  |
 *      |  O 3 3 3 3 . . . .  |
 *      |  O O O O O O O O O  |
 *      +---------------------+
 *  
 *
 *  Macro of selected device
 *  ------------------------
 *
 *  When selecting a device in Bitwig Studio, the 8 Macro settings are
 *  mapped to the following 8 encoders on the Code:
 *      +---------------------+
 *      |  O . . . . . . . .  |
 *      |  O . . . . . . . .  |
 *      |  O . . . . s s s s  |
 *      |  O . . . . s s s s  |
 *      |  O O O O O O O O O  |
 *      +---------------------+
 *
 *
 *  Select track
 *  ------------
 *
 *  You can use the lower row of Code buttons to select track:
 *      +---------------------+
 *      |  O . . . . . . . .  |
 *      |  O . . . . . . . .  |
 *      |  O . . . . . . . .  |
 *      |  O . . . . . . . .  |
 *      |  O x x x x x x x x  | 8 track selection
 *      +---------------------+
 *
 *
 * Setup
 * -----                    
 *  We need to set Livid Code to defaults and the following opt. changes
 *    * enc speed A = 1x
 *    * enc speed B = 1/4x
 *    * top left button momentary enc speed
 */
loadAPI (1)

var VERSION = '1.0'

// --------------------------------------------- BASIC SETUP
// set properties
host.defineController
( 'Lucidogen', 'Code', '1.0', '2f722a80-d8cb-11e5-a837-0800200c9a66' )

host.defineMidiPorts ( 1, 1 )

// --------------------------------------------- KNOBS SETUP
// Number of controls watched on selected track
var STRACK_CONTROLS_COUNT = 8
var RESOLUTION = 128
var MACROS   = []
// Bitwig macro layout
var BW_MACROS =
[  1,  2,  3,  4,    9, 10, 11, 12
,  5,  6,  7,  8,   13, 14, 15, 16

, 17, 18, 19, 20,   25, 26, 27, 28
, 21, 22, 23, 24,   29, 30, 31, 32
]
// We use default mapping for simplification
var CODE_ROTARY =
[  1,  5,  9, 13,   17, 21, 25, 29
,  2,  6, 10, 14,   18, 22, 26, 30

,  3,  7, 11, 15,   19, 23, 27, 31
,  4,  8, 12, 16,   20, 24, 28, 32
]

var CTRL_TO_MAC = []
var MAC_TO_CTRL = []
for ( var i = 0; i < BW_MACROS.length; ++i )
{ var ctrl = CODE_ROTARY [ i ]
  var mac  = BW_MACROS  [ i ]
  CTRL_TO_MAC [ ctrl ] = mac
  MAC_TO_CTRL [ mac  ] = ctrl
}

function setupMacros ( strack, sdevice )
{ 
  // Devices of selected track
  var sdevices =
  strack.createDeviceBank ( STRACK_CONTROLS_COUNT )

  function setupMacro ( macro, mac )
  { var ctrl  = MAC_TO_CTRL [ mac ]
    macro.addValueObserver
    ( RESOLUTION, function ( value )
      { // channel 1, cc, value
        midiOut.sendMidi ( 0xB0, ctrl, value )
      }
    )
    macro.setIndication ( true )
    MACROS [ mac ] = macro
  }

  // first 3 devices in selected track
  for ( var i = 0; i < 24; ++i )
  { var macro = sdevices.getDevice ( Math.floor ( i / 8 ) )
    .getMacro ( i % 8 ).getAmount ()
    setupMacro ( macro, i + 1 )
  }

  // selected device
  for ( var i = 24; i < 32; ++i )
  { var macro = sdevice.getMacro ( i ).getAmount ()
    setupMacro ( macro, i + 1 )
  }
}

// --------------------------------------------- BUTTONS SETUP
// TRACKS = [  0,  1, ...,  7 ]
// NOTES  = [ 38, 39, ..., 45 ]
var TRACK_BANK_COUNT = 8
var trackBank
function trackToNote ( track )
{ if ( track < 8 )
  { return track + 38
  } else
  { return -1
  }
}

function noteToTrack ( note )
{ if ( note >= 38 && note <= 45 )
  { return note - 38
  } else
  { return -1
  }
}
  
function setupSTrack ( strack )
{
  var lnote = -1
  strack.addPositionObserver
  ( function ( pos )
    { println ( 'POSITION: ' + pos )
      if ( lnote > 0 )
      { // channel 1 NoteOff, note, velocity
        midiOut.sendMidi ( 0x80, lnote, 0 )
      }

      var note = trackToNote ( pos )
      if ( note > 0 )
      { // channel 1 NoteOn, note, velocity
        midiOut.sendMidi ( 0x90, note, 127 )
        lnote = note
      }
    }
  )
}

function setupButtons ( strack )
{ trackBank = host.createMainTrackBank ( TRACK_BANK_COUNT, 0, 0 )
}

function init ()
{ // Set MIDI callbacks
  host.getMidiInPort ( 0 )
  .setMidiCallback ( onMidi )

  midiOut =
  host.getMidiOutPort ( 0 )

  // Selected track
  var strack =
  host.createArrangerCursorTrack ( 2, 0 )

  var sdevice =
  host.createEditorCursorDevice ()

  setupSTrack ( strack )

  setupMacros ( strack, sdevice )

  setupButtons ( strack )

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

  if ( status == 0x90 ) // NoteOn, channel 1
  { var tid = noteToTrack ( data1 )
    if ( tid >= 0 )
    { // select track
      var track = trackBank.getTrack ( tid )
      if ( track )
      { track.select ()
      }
    }
  }
}
