; Custom NSIS include for BarcodePrinter.
; Disables CRC integrity check so installer/uninstaller work when the .exe
; was copied (e.g. USB) or in environments where the check falsely fails.
!macro customHeader
  CRCCheck off
!macroend
