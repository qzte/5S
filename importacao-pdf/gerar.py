"""Gera o JSON de importação a partir das leituras dos PDFs (página 1).
Cada auditoria: respostas por item da app (n) -> (valor, classificação 0/1/2, target)."""
import json, csv
M,O,E=0,1,2
NOMES={1:"Artigos extra acordo",2:"Artigos inactivos",3:"Kanbans quantidades excessivas (amostra)",
4:"Estantes c/ dificuldade reabastecimento",5:"Artigos sem etiqueta de posição",6:"Estantes sem identificação visual",
7:"Kanbans vazios mal arrumados",8:"Artigos em rutura mal identificados",9:"Prateleiras danificadas",
10:"Kanbans/caixas mau estado",11:"Caixas sujas",12:"Temperatura (0-2)",13:"Espaço arrumado e limpo (0-2)",
14:"Caixas não adaptadas",15:"Norma de picking/elementos (0-4)",16:"Artigos fora da localização Index",
17:"Norma de picking não respeitada",18:"Norma de reposição (amostra)",19:"Kanbans fora de validade (amostra)"}
# ID, serviço, taxa no PDF, {n:(valor,class,target)}; itens omitidos = (0,Excelente)
LEIT=[
 (69,"Consulta Externa - Otorrino (70CE2)","93,25%",{17:(1,O),1:(1,O),15:(4,E),12:(2,E),3:(0,E,10),18:(0,E,5),13:(2,E),19:(0,E,10)}),
 (70,"Consulta Externa - Ginecologia/Obstetrícia (70CE3)","96,50%",{3:(3,O,20),15:(4,E),12:(2,E),18:(0,E,6),13:(2,E),19:(0,E,20)}),
 (71,"Consulta Externa - Ortopedia (70CE7)","96,50%",{3:(1,O,10),15:(4,E),12:(2,E),18:(0,E,3),13:(2,E),19:(0,E,10)}),
 (72,"Pediatria (15A)","84,75%",{12:(0,M),16:(1,O),3:(2,O,30),18:(3,O,11),15:(4,E),13:(2,E),19:(0,E,30)}),
 (73,"Farmácia (52)","80,25%",{16:(1,O),17:(3,O),1:(1,O),3:(1,O,20),7:(2,O),13:(1,O),15:(4,E),12:(2,E),18:(0,E,9),19:(0,E,20)}),
 (74,"Tec.Nefrologia (70EE10)","71,75%",{12:(0,M),17:(2,O),1:(1,O),4:(1,O),3:(1,O,20),18:(3,O,9),7:(1,O),13:(1,O),15:(4,E),19:(0,E,20)}),
 (75,"Obstetrícia J (13J)","83,50%",{17:(1,O),5:(1,O),2:(1,O),3:(1,O,20),18:(2,O,6),15:(4,E),12:(2,E),13:(2,E),19:(0,E,20)}),
 (76,"UCI Neonatal (15NN)","96,50%",{3:(1,O,20),15:(4,E),12:(2,E),18:(0,E,5),13:(2,E),19:(0,E,20)}),
 (77,"Consulta Externa - Dor Crônica (12345)","88,00%",{12:(0,M),3:(2,O,20),19:(1,O,20),15:(4,E),18:(0,E,4),13:(2,E)}),
 (78,"UADCI - Un. Adm. Doente Cir. Int (29997)","84,75%",{12:(0,M),1:(1,O),2:(1,O),19:(1,O,20),15:(4,E),3:(0,E,20),18:(0,E,9),13:(2,E)}),
 (79,"SMI - Serviço Medicina Intensiva (116011)","69,75%",{12:(0,M),3:(4,M,20),17:(3,O),1:(2,O),2:(1,O),14:(1,O),9:(2,O),19:(1,O,20),15:(4,E),18:(0,E,35),13:(2,E)}),
 (80,"Cirurgia I (11I)","66,50%",{8:(2,M),1:(3,M),16:(1,O),17:(1,O),2:(1,O),6:(1,O),3:(3,O,20),18:(3,O,17),9:(1,O),15:(4,E),12:(2,E),13:(2,E),19:(0,E,20)}),
 (81,"Medicina D (14D)","78,25%",{8:(2,M),17:(1,O),5:(1,O),2:(1,O),3:(2,O,20),19:(1,O,20),15:(4,E),12:(2,E),18:(0,E,17),13:(2,E)}),
 (82,"TIM - Técnicas Invasivas Medicina Geral (20701)","74,25%",{12:(0,M),6:(5,M),3:(4,M,20),15:(3,O),17:(1,O),1:(1,O),18:(0,E,10),13:(2,E),19:(0,E,20)}),
 (83,"TIM - Cardiologia (20704)","84,75%",{12:(0,M),15:(3,O),5:(1,O),6:(1,O),13:(2,E),3:(0,E,7),18:(0,E,1),19:(0,E,7)}),
 (84,"Medicina F (14F)","76,25%",{12:(0,M),3:(5,M,30),17:(1,O),8:(1,O),2:(1,O),19:(1,O,30),15:(4,E),18:(0,E,10),13:(2,E)}),
 (85,"Cirurgia C (11C)","73,75%",{16:(1,O),17:(1,O),8:(1,O),1:(2,O),4:(1,O),3:(2,O,30),13:(1,O),19:(1,O,30),15:(4,E),12:(2,E),18:(0,E,16)}),
 (86,"VMER (VMER)","82,75%",{12:(0,M),3:(4,M,30),17:(1,O),19:(1,O,20),15:(4,E),18:(0,E,6),13:(2,E)}),
 (87,"Unidade Medicina Hiperbárica (23UMH)","84,75%",{19:(2,M,20),15:(2,O),1:(2,O),3:(3,O,30),12:(2,E),18:(0,E,4),13:(2,E)}),
 (88,"ACES - USF Godinho de Faria (127313)","86,75%",{16:(1,O),17:(1,O),8:(1,O),3:(3,O,20),15:(4,E),12:(2,E),18:(0,E,10),13:(2,E),19:(0,E,20)}),
 (89,"ACES - USF Infesta (125803)","88,00%",{3:(8,M,30),17:(3,O),8:(1,O),15:(4,E),12:(2,E),18:(0,E,10),13:(2,E),19:(0,E,20)}),
 (90,"ACES - UCC S. Mamede (125806)","83,50%",{17:(2,O),8:(1,O),1:(2,O),3:(3,O,20),19:(1,O,20),15:(4,E),12:(2,E),18:(0,E,13),13:(2,E)}),
 (91,"Medicina M (14M)","83,50%",{16:(1,O),17:(2,O),8:(1,O),3:(2,O,20),7:(1,O),15:(4,E),12:(2,E),18:(0,E,13),13:(2,E),19:(0,E,20)}),
 (92,"Exames Especiais - Gastroenterologia (70EE1)","81,50%",{6:(3,M),17:(4,O),8:(1,O),3:(2,O,20),18:(1,O,11),15:(4,E),12:(2,E),13:(2,E),19:(0,E,20)}),
]
audits=[];linhas=[]
for pid,svc,taxa,r in LEIT:
    it=[(r.get(n,(0,E))+(None,))[:3] for n in range(1,20)]
    audits.append({"id":2026000000+pid,"service":svc,"date":"2026-01-01","note":f"Importada de PDF (ID{pid})",
      "scores":[x[1] for x in it],"raw":[x[0] for x in it],"tgts":[x[2] for x in it]})
    for n,x in enumerate(it,1):
        linhas.append([pid,svc,taxa,n,NOMES[n],x[0],x[2] or "",["Mau","Com Oportunidade","Excelente"][x[1]]])
json.dump({"app":"auditoria5s","version":"4.2.9","exportedAt":"2026-11-11T00:00:00Z","audits":audits,
  "services":[a["service"] for a in audits],"people":[]},open("auditorias-pdf.json","w"),ensure_ascii=False,indent=1)
with open("conferencia.csv","w",newline="",encoding="utf-8-sig") as f:
    w=csv.writer(f,delimiter=";");w.writerow(["ID PDF","Serviço","Taxa PDF","Item app","Pergunta","Valor","Target","Classificação"]);w.writerows(linhas)
