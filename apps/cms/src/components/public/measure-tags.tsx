/**
 * Analytics ve Metrika etiketleri. Kimlik ve yönetici HTML kodu sunucuda doğrulanmış gelir.
 * Ziyaretçi bileşeni değildir: betik etiketini sunucu basar.
 */
export function MeasureTags({
  gaId,
  metrikaId,
  metrikaHtml,
}: {
  gaId: string | null;
  metrikaId: string | null;
  metrikaHtml?: string | null;
}) {
  if (!gaId && !metrikaId && !metrikaHtml) return null;
  return (
    <>
      {gaId ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId.replace(/[^A-Za-z0-9-]/g, "")}');`,
            }}
          />
        </>
      ) : null}
      {metrikaHtml ? (
        <div id="nx-yandex-metrika" dangerouslySetInnerHTML={{ __html: metrikaHtml }} />
      ) : metrikaId ? (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}","ym");ym(${metrikaId},"init",{ssr:true,clickmap:true,trackLinks:true,accurateTrackBounce:true});`,
            }}
          />
          <noscript>
            <div>
              <img src={`https://mc.yandex.ru/watch/${metrikaId}`} alt="" style={{ position: "absolute", left: "-9999px" }} />
            </div>
          </noscript>
        </>
      ) : null}
    </>
  );
}
