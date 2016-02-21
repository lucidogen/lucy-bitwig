loadAPI (1)

// Number of controls watched on selected track
var STRACK_CONTROLS_COUNT = 8

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
  strack =
  host.createArrangerCursorTrack ( 2, 0 )

  // Devices of selected track
  sdevices =
  strack.createDeviceBank ( STRACK_CONTROLS_COUNT )

  sdevices
  .getDevice ( 0 )
  .getMacro  ( 0 )
  .getAmount ()
  .addValueObserver
  ( 128, function ( value )
    { println( 'MACRO1: ' + value )
      // channel 1, cc 1, value
      midiOut.sendMidi ( 0xB0, 1, value )
    }
  )

  sdevices
  .getDevice ( 0 )
  .getMacro  ( 1 )
  .getAmount ()
  .addValueObserver
  ( 128, function ( value )
    { println( 'MACRO2: ' + value )
      midiOut.sendMidi ( 0xB0, 5, value )
    }
  )
}

function onMidi ( status, data1, data2 )
{
  if ( isChannelController ( status ) )
  { // ...
  }
}
