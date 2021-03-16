export const grammar = `
<grammar root="smarthome">
    <rule id="smarthome">

        <ruleref uri="#order"/>
            <tag>out.order= new Object(); out.order.object=rules.order.entity; out.order.action=rules.order.event;</tag>
        </rule>

    <item repeat="0-">please</item>

    <rule id="verb">
        <one-of>
            <item>open<tag>out='open';</tag></item>
            <item>close<tag>out='close';</tag></item>
        </one-of>
        </rule>

    <rule id="on_off">
            <one-of>
                <item></item>
                <item>turn on</item>
                <item>turn off</item>
                <item>turn up</item>
                <item>turn down</item>
            </one-of>
        </rule>

    <rule id="appliance">
        the
        <one-of>
            <item>light<tag>out='light';</tag></item>
            <item>AC<tag>out='air conditioning';</tag></item>
            <item>A C<tag>out='air conditioning';</tag></item>
            <item>air conditioning</item>
            <item>heat<tag> out='heat';</tag></item>
        </one-of>
        </rule>

    <rule id="opening">
        the
        <one-of>
            <item>door</item>
            <item>window</item>
        </one-of>
        </rule>
    
 <rule id="order">

  <one-of>
   
      <item>
      <ruleref uri="#on_off"/>
      <ruleref uri="#appliance"/>
        <tag> out.event=rules.on_off; out.entity=rules.appliance;</tag>
      </item>

      <item>
      <ruleref uri="#verb"/>
      <ruleref uri="#opening"/>
        <tag> out.event=rules.verb; out.entity=rules.opening;</tag>
      </item>

  </one-of>
</rule>
</grammar>
`