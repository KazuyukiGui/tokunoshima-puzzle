結論として、14件中「妥当」4件、「要修正」10件です。特に内千川・御前堂・花時名・反川は位置のずれが大きく、上晴の現座標はほぼ御前堂側にあります。

徳之島町分の修正値は、原則としてe-Stat「令和2年国勢調査町丁・字等別境界」を変換したGeoshapeの「図形中心点」を採用しました。これは集落人口の重心ではなく境界ポリゴンの幾何中心なので、広大な山林を含む区域では「一貫した代表点」としての値です。座標順はすべて `lon, lat`、WGS84、小数4桁です。

| 集落 | 判定 | 修正座標 | 根拠 |
|---|---|---:|---|
| 山里 | 要修正 | **128.9432, 27.8671** | 国勢調査境界「山山里」の図形中心。現点から約1.9 km北西。[Geoshape 山山里](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530022004.html) |
| 内千川 | 要修正 | **128.9606, 27.8692** | 国勢調査境界「山内千川」の図形中心。現点は約8.2 km南で、母間側に寄りすぎている。[Geoshape 山内千川](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530022003.html) |
| 上花徳 | 要修正 | **128.9445, 27.8239** | 国勢調査境界「花徳上花徳」の中心。現点から約1.1 km西。[Geoshape 花徳上花徳](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530018003.html)／[上花徳農業研修館](https://www.tokunoshima-town.org/shisetsu/kominkan/s061.html) |
| 新村 | 妥当 | ―（参考 **128.9651, 27.8261**） | 国勢調査境界「花徳新村」の中心との差は約180 mで、ゲーム用代表点として許容範囲。[Geoshape 花徳新村](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530018002.html) |
| 大当 | 要修正 | **128.9811, 27.8099** | 小さな国勢調査境界「母間大当」の中心。現点から約370 m北西。[Geoshape 母間大当](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530014003.html)／[大当生活館](https://www.tokunoshima-town.org/shisetsu/kominkan/s086.html) |
| 旭ケ丘 | 要修正 | **129.0076, 27.7826** | 国勢調査境界「井之川旭ケ丘」の中心。現点より約410 m南東。[Geoshape 井之川旭ケ丘](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530011002.html)／[旭ヶ丘公民館](https://www.tokunoshima-town.org/shisetsu/kominkan/s070.html) |
| 上晴 | 要修正 | **不明**（現点は棄却） | 公的避難施設一覧では上晴営農センターを「伊仙町崎原126」としており、上晴は西部の崎原側。現点 `128.9430,27.6870` は後述の御前堂・義名山運動公園付近なので明確に誤り。ただし崎原126の信頼できる公開座標を確認できず、4桁値は提示しない。[内閣官房 避難施設一覧PDF](https://www.kokuminhogo.go.jp/pdf/list/hinan_kagoshima.pdf)／[農業集落境界・上晴](https://geoshape.ex.nii.ac.jp/ma/resource/46/4653200027.html) |
| 御前堂 | 要修正 | **128.9425, 27.6885** | 伊仙町公式が義名山総合運動公園を御前堂の主要施設として紹介。体育館公開座標を代表点とした。現点から約2.2 km西北西。[伊仙町集落紹介](https://town.isen.kagoshima.jp/mirai/syuurakujouhou.html)／[伊仙町総合体育館座標](https://mapfan.com/spots/SCCQ4%2CJ%2CKD0) |
| 河地 | 妥当 | ―（参考 **128.9229, 27.7335**） | 河地簡易郵便局の公開位置との差は約60 m。施設代表点として十分妥当。[郵便局位置](https://pubnavi.jp/facility/175922)／[日本郵便・糸木名749-1](https://www.post.japanpost.jp/newsrelease/storeinformation/detail/index.php?id=9735) |
| 畦 | 要修正 | **128.9640, 27.8458** | 現点はプリンスビーチ寄り。国勢調査境界「山畦」の中心は約500 m西で、集落カードの代表点にはこちらが適する。[Geoshape 山畦](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530022001.html)／[畦集落センター](https://www.tokunoshima-town.org/shisetsu/kominkan/s060.html) |
| 花時名 | 要修正 | **128.9749, 27.7987** | 国勢調査境界「母間花時名」の中心。現点は河口・展望台側に約1.7 km北寄り。[Geoshape 母間花時名](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530014004.html)／[花時名公民館](https://www.tokunoshima-town.org/shisetsu/kominkan/s073.html) |
| 反川 | 要修正 | **128.9850, 27.8041** | 小さな国勢調査境界「母間反川」の中心。現点は川名から置いたため約900 m西にずれている。[Geoshape 母間反川](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530014002.html)／[反川公民館](https://www.tokunoshima-town.org/shisetsu/kominkan/s083.html) |
| 池間 | 妥当 | ―（参考 **128.9933, 27.8038**） | 国勢調査境界「母間池間」の中心との差は約90 mで、施設位置による代表点として妥当。[Geoshape 母間池間](https://geoshape.ex.nii.ac.jp/ka/resource/46/46530014001.html) |
| 大原 | 妥当 | ― | 大原カントリークラブの公開位置は `128.9798,27.7393` で、現点との差は約230 m。施設代表点として妥当。国勢調査境界の中心 `128.9853,27.7376` は広大な約15.9 km²の区域中心なので、必ずしも集落代表点として優れていない。[クラブ位置](https://mapfan.com/spots/SIAY%2CJ%2CG281R)／[Geoshape 大原](https://geoshape.ex.nii.ac.jp/ka/resource/46/465300070.html) |

## 追加確認1：徳之島町の統合

統合方法以前に、元の「公式31区」一覧を修正する必要があります。

現在の徳之島町公式人口表は、集落数を30としており、質問中の一覧との主な差は次の3点です。

- 「花徳」ではなく **前川**
- 「山」ではなく **港川**
- **母間は独立集落として数えない**。池間・反川・大当・花時名などの親大字

公式の30集落は人口表および集落紹介で確認できます。[徳之島町・集落別人口](https://www.tokunoshima-town.org/kikakuka/chose/toke/jinko.html)／[徳之島町・30集落紹介](https://www.tokunoshima-town.org/kikakuka/kurashi/uiturn/2024syuraku.html)

したがって、現在の公式30集落から、

- 亀津4区を1枚に統合：3枚減
- 大原1・大原2を1枚に統合：1枚減

とすると、正しくは **26カード** です。27カードになるのは、母間などの親大字を余分に1枚含めた場合です。

ゲーム上の統合自体は妥当ですが、表示は「亀津（南・中・北・東）」および「大原（1・2）」とするのが安全です。ただし行政的には亀津4区は別々の区で、大原1・2も別集落です。特に大原1と大原2は、それぞれ大字亀津側・大字白井側に属するため、「公式区分そのもの」とは説明しない方がよいです。

## 追加確認2：伊仙町の20集落

主要な地理的集落の抜けはありません。20項目は、公式31集落を上位名でまとめた構成です。

31になる内訳は、次の6項目を細分したためです。

- 目手久：東・西
- 面縄：東面縄・上面縄東・上面縄西
- 検福：上・下
- 伊仙：東東・東西・中東・中西・西東・西西
- 阿権：東・西
- 犬田布：東・西

それ以外の14項目は単独扱いで、合計31です。[伊仙町公式・集落情報](https://town.isen.kagoshima.jp/mirai/syuurakujouhou.html)

したがって20カード方式は妥当ですが、「公式31集落を20地域に統合」と明記し、上記の枝集落名をカードの副題か説明欄に載せるのがよいでしょう。なお農林業センサスでは阿三・鹿浦などをさらに分けた33農業集落になっていますが、これは統計上の単位が異なるため、主要集落の欠落とはみなしません。[伊仙町農業集落境界一覧](https://geoshape.ex.nii.ac.jp/ma/resource/46532.html)
