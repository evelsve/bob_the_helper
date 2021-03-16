export const grammar = `
<grammar root="order">
    <rule id="order">
        <ruleref uri="#parsed"/>
            <tag>out=rules.parsed;out=rules.parsed;</tag>
        </rule>

    <rule id="turn">
            <item>turn<ruleref uri="#on_off"/><tag>out=rules.on_off</tag></item>
        </rule>

    <rule id="position">
        <one-of>
            <item>open<tag>out='open';</tag></item>
            <item>close<tag>out='close';</tag></item>
        </one-of>
        </rule>

    <rule id="on_off">
            <one-of>
                <item>on<tag>out='on';</tag></item>
                <item>off<tag>out='off';</tag></item>
            </one-of>
        </rule>

    <rule id="appliance">
        the
        <one-of>
            <item>light<tag>out='light';</tag></item>
            <item>AC<tag>out='AC';</tag></item>
            <item>air conditioning<tag>out='AC';</tag></item>
            <item>heat<tag> out='heat';</tag></item>
        </one-of>
        </rule>

        <rule id="opening">
        the
        <one-of>
            <item>door<tag>out='door';</tag></item>
            <item>window<tag>out='window';</tag></item>
        </one-of>
        </rule>
    
 <rule id="parsed">
  <one-of>
   
      <item>
      <ruleref uri="#turn"/>
      <ruleref uri="#appliance"/>
      <ruleref uri="#on_off"/>
        <tag> out.turn=rules.turn?rules.turn:rules.on_off;out.appliance=rules.appliance;</tag>
      </item>

      <item>
      <ruleref uri="#position"/>
      <ruleref uri="#opening"/>
        <tag> out.position=rules.position; out.opening=rules.opening;</tag>
      </item>

  </one-of>
</rule>
</grammar>
`