export const grammar = `
<grammar root="quote">

   <rule id="quote">
      <one-of>
         <item>to do is to be<tag>out.author="socrates";</tag></item>
         <item>to be is to do<tag>out.author="sartre";</tag></item>
         <item>do be do be do<tag>out.author="sinatra";</tag></item>
      </one-of>
   </rule>

</grammar>
`
