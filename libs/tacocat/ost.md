# Milo/Tacocat placeholders

## Assumptions
  Helix pipeline preserves links having custom schema
  Such links appear in the resulting HTML as <a href=""></a> tags

## Sidekick
  a browser extension for Milo
  hosts placeholder dialogs (OST) and activates them on author interaction
  when launches first time, registers custom link schema listener (web+milo:placeholder)
    custom schema tells Sidekick that such link is associated with placeholder
    placeholders use custom dialogs to let the author to configure particular type of placeholders
      e.g. if link starts with milo://placeholder/wcs/
        the listener opens OST on such link click
        the OST pre-selects its options from link params
    placeholser require special processing client-side, Tacocat

## OST
  a placeholder plugin for Sidekick
  shows a dialog, helping the author to select web commerce offers for display
  as dialog finishes generates placeholder link
    web+milo:placeholder/wcs/artifact?offerSelectorId=abcd1234&template=priceOptical
      milo://placeholder - custom schema and domain bound to Sidekick
      wcs - name of the placeholder pipeline to use for this placeholder
      artifact - name of the service endpoint providing data for the placeholder
      ?offerSelectorId=abcd1234&template=priceOptical - placeholder parameters

  allows user to copy generated link so to paste it into the edited document
    a click on such link will be intercepted by Sidekick
    cliend side, placeholder link will be processed by Tacocat

## Tacocat
  a cliend-side library processing placeholder links
  scans DOM tree for placeholder links marked with custom schema
  calls registered placeholder pipelines to resolve placeholder links based on their params
    WCS pipeline
      extracts service endpoint data and placeholder context from the link href
      applies `pending` template to the link element
      initiates request to the service endpoint for data
      applies either `resolved` or `rejected` template to the service result
  reports placeholder errors to Lana
