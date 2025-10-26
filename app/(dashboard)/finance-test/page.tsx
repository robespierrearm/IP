'use client';
import {useEffect,useState,useMemo} from 'react';
import {supabase,Tender,Expense} from '@/lib/supabase';
import {TrendingUp,TrendingDown,DollarSign,FileText,Calendar,Target,BarChart3,PieChart,Edit,Trash2,Download} from 'lucide-react';
import {Card,CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

interface TenderWithExpenses{tender:Tender;expenses:Expense[];}
type Period='all'|'month'|'quarter'|'year';

export default function FinanceTestPage(){
const [data,setData]=useState<TenderWithExpenses[]>([]);
const [loading,setLoading]=useState(true);
const [period,setPeriod]=useState<Period>('all');
const [date,setDate]=useState(new Date());
const [expanded,setExpanded]=useState<number|null>(null);
const [adding,setAdding]=useState<number|null>(null);
const [editing,setEditing]=useState<Expense|null>(null);
const [form,setForm]=useState({category:'',amount:0,description:'',is_cash:false});

const load=async()=>{
setLoading(true);
const {data:t}=await supabase.from('tenders').select('*').in('status',['победа','в работе','завершён']).order('created_at',{ascending:false});
if(!t){setLoading(false);return;}
const {data:e}=await supabase.from('expenses').select('*').in('tender_id',t.map(x=>x.id));
setData(t.map(tender=>({tender,expenses:(e||[]).filter(x=>x.tender_id===tender.id)})));
setLoading(false);
};

useEffect(()=>{load();},[]);

const filtered=useMemo(()=>{
if(period==='all')return data;
const y=date.getFullYear(),m=date.getMonth();
let s:Date,e:Date;
if(period==='month'){s=new Date(y,m,1);e=new Date(y,m+1,0);}
else if(period==='quarter'){const q=Math.floor(m/3)*3;s=new Date(y,q,1);e=new Date(y,q+3,0);}
else{s=new Date(y,0,1);e=new Date(y,11,31);}
return data.filter(i=>new Date(i.tender.created_at||'')>=s&&new Date(i.tender.created_at||'')<=e);
},[data,period,date]);

const stats=useMemo(()=>{
const comp=filtered.filter(t=>t.tender.status==='завершён');
const work=filtered.filter(t=>t.tender.status==='в работе');
const won=filtered.filter(t=>t.tender.status==='победа');
const cInc=comp.reduce((s,t)=>s+(t.tender.win_price||0),0);
const wInc=work.reduce((s,t)=>s+(t.tender.win_price||0),0);
const pInc=won.reduce((s,t)=>s+(t.tender.win_price||0),0);
const totExp=filtered.reduce((s,t)=>s+t.expenses.reduce((x,e)=>x+e.amount,0),0);
const bank=filtered.reduce((s,t)=>s+t.expenses.filter(e=>!e.is_cash).reduce((x,e)=>x+e.amount,0),0);
const cash=totExp-bank;
const prof=cInc-totExp;
const taxProf=cInc-bank;
const tax=taxProf>0?taxProf*0.07:0;
const net=prof-tax;
const cats:Record<string,number>={};
filtered.forEach(t=>t.expenses.forEach(e=>cats[e.category]=(cats[e.category]||0)+e.amount));
return {cInc,wInc,pInc,totInc:cInc+wInc+pInc,totExp,bank,cash,prof,tax,net,cats,cnt:filtered.length};
},[filtered]);

const fmt=(n:number)=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(n);
const fmtC=(n:number)=>n>=1e6?`${(n/1e6).toFixed(1)}М`:n>=1e3?`${(n/1e3).toFixed(0)}К`:n.toString();

const periodLabel=()=>{
const ms=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
if(period==='month')return `${ms[date.getMonth()]} ${date.getFullYear()}`;
if(period==='quarter')return `Q${Math.floor(date.getMonth()/3)+1} ${date.getFullYear()}`;
if(period==='year')return `${date.getFullYear()}`;
return 'За всё время';
};

const save=async(tid:number)=>{
if(!form.category.trim()||form.amount<=0){alert('Заполните форму');return;}
if(editing){
await supabase.from('expenses').update({category:form.category,amount:form.amount,description:form.description,is_cash:form.is_cash}).eq('id',editing.id);
}else{
await supabase.from('expenses').insert([{tender_id:tid,category:form.category,amount:form.amount,description:form.description,is_cash:form.is_cash}]);
}
setForm({category:'',amount:0,description:'',is_cash:false});
setEditing(null);
setAdding(null);
load();
};

const edit=(e:Expense)=>{
setEditing(e);
setForm({category:e.category,amount:e.amount,description:e.description||'',is_cash:e.is_cash||false});
setAdding(e.tender_id);
};

const del=async(id:number)=>{
if(!confirm('Удалить?'))return;
await supabase.from('expenses').delete().eq('id',id);
load();
};

const changeDate=(dir:number)=>{
const d=new Date(date);
if(period==='month')d.setMonth(d.getMonth()+dir);
else if(period==='quarter')d.setMonth(d.getMonth()+dir*3);
else d.setFullYear(d.getFullYear()+dir);
setDate(d);
};

if(loading)return <div className="p-8 max-w-7xl mx-auto"><div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"/><p className="text-gray-600 mt-4">Загрузка...</p></div></div>;

return (
<div className="p-4 md:p-8 max-w-7xl mx-auto">
<div className="mb-6 flex items-center justify-between">
<div>
<h1 className="text-3xl font-bold text-gray-900">Финансы и Аналитика</h1>
<p className="text-sm text-gray-600 mt-1">🧪 Тестовая версия с периодами, аналитикой и прогнозами</p>
</div>
</div>

<Card className="mb-6 backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-4">
<div className="flex items-center gap-4 flex-wrap">
<Calendar className="h-5 w-5 text-blue-600"/>
<div className="flex gap-2">
<Button size="sm" variant={period==='all'?'default':'outline'} onClick={()=>setPeriod('all')}>Всё время</Button>
<Button size="sm" variant={period==='month'?'default':'outline'} onClick={()=>setPeriod('month')}>Месяц</Button>
<Button size="sm" variant={period==='quarter'?'default':'outline'} onClick={()=>setPeriod('quarter')}>Квартал</Button>
<Button size="sm" variant={period==='year'?'default':'outline'} onClick={()=>setPeriod('year')}>Год</Button>
</div>
{period!=='all'&&(
<div className="flex items-center gap-2">
<Button size="sm" variant="ghost" onClick={()=>changeDate(-1)}>←</Button>
<span className="font-semibold text-gray-900">{periodLabel()}</span>
<Button size="sm" variant="ghost" onClick={()=>changeDate(1)}>→</Button>
</div>
)}
</div>
</CardContent>
</Card>

<Tabs defaultValue="accounting" className="space-y-6">
<TabsList className="grid w-full grid-cols-2 max-w-md">
<TabsTrigger value="accounting">📊 Бухгалтерия</TabsTrigger>
<TabsTrigger value="analytics">📈 Аналитика</TabsTrigger>
</TabsList>

<TabsContent value="accounting" className="space-y-6">
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
<Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-4">
<div className="flex items-center justify-between">
<div><p className="text-sm text-gray-600">Проектов</p><p className="text-2xl font-bold text-gray-900">{stats.cnt}</p></div>
<FileText className="h-8 w-8 text-blue-600"/>
</div>
</CardContent>
</Card>

<Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-4">
<div className="flex items-center justify-between">
<div><p className="text-sm text-gray-600">Доход (получено)</p><p className="text-2xl font-bold text-green-600">{fmt(stats.cInc)}</p></div>
<TrendingUp className="h-8 w-8 text-green-600"/>
</div>
</CardContent>
</Card>

<Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-4">
<div>
<p className="text-sm text-gray-600 mb-1">Расходы</p>
<p className="text-2xl font-bold text-red-600">{fmt(stats.totExp)}</p>
<div className="flex gap-2 mt-1 text-xs">
<span className="text-gray-600">💳 {fmtC(stats.bank)}</span>
<span className="text-gray-600">💵 {fmtC(stats.cash)}</span>
</div>
</div>
</CardContent>
</Card>

<Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-4">
<div className="flex items-center justify-between">
<div><p className="text-sm text-gray-600">Чистая прибыль</p><p className={`text-2xl font-bold ${stats.net>0?'text-green-600':'text-red-600'}`}>{fmt(stats.net)}</p><p className="text-xs text-gray-500">После УСН 7%</p></div>
<DollarSign className={`h-8 w-8 ${stats.net>0?'text-green-600':'text-red-600'}`}/>
</div>
</CardContent>
</Card>
</div>

<Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-4">
<h3 className="font-semibold text-gray-900 mb-4">Проекты</h3>
<div className="space-y-2">
{filtered.length===0?<p className="text-center text-gray-500 py-8">Нет данных</p>:filtered.map(i=>{
const isExp=expanded===i.tender.id;
const tExp=i.expenses.reduce((s,e)=>s+e.amount,0);
const tInc=i.tender.win_price||0;
const tProf=tInc-tExp;
return (
<div key={i.tender.id} className="border rounded-lg overflow-hidden">
<button onClick={()=>setExpanded(isExp?null:i.tender.id)} className="w-full p-3 flex items-center justify-between hover:bg-gray-50">
<div className="text-left flex-1">
<p className="font-medium text-gray-900">{i.tender.name}</p>
<div className="flex items-center gap-4 mt-1 text-sm">
<span className="text-gray-600">Доход: <span className="text-green-600 font-medium">{fmt(tInc)}</span></span>
<span className="text-gray-600">Расходы: <span className="text-red-600 font-medium">{fmt(tExp)}</span></span>
<span className={`font-bold ${tProf>0?'text-green-600':'text-red-600'}`}>{fmt(tProf)}</span>
</div>
</div>
<span className="text-gray-400">{isExp?'▲':'▼'}</span>
</button>
{isExp&&(
<div className="border-t bg-gray-50 p-4 space-y-3">
<div className="flex items-center justify-between mb-2">
<h4 className="font-semibold text-gray-900">Расходы</h4>
<Button size="sm" onClick={()=>{
if(adding===i.tender.id){setAdding(null);setEditing(null);setForm({category:'',amount:0,description:'',is_cash:false});}
else{setAdding(i.tender.id);}
}}>{adding===i.tender.id?'Отмена':'+ Добавить'}</Button>
</div>
{adding===i.tender.id&&(
<div className="bg-white p-3 rounded border space-y-2">
{editing&&<p className="text-sm text-blue-600 font-medium">Редактирование</p>}
<div className="grid grid-cols-3 gap-2">
<Input placeholder="Категория" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
<Input type="number" placeholder="Сумма" value={form.amount||''} onChange={e=>setForm({...form,amount:parseFloat(e.target.value)||0})}/>
<Input placeholder="Описание" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
</div>
<div className="flex items-center gap-2">
<input type="checkbox" checked={form.is_cash} onChange={e=>setForm({...form,is_cash:e.target.checked})} className="h-4 w-4"/>
<Label>💵 Наличка</Label>
</div>
<Button size="sm" className="w-full" onClick={()=>save(i.tender.id)}>{editing?'Обновить':'Сохранить'}</Button>
</div>
)}
{i.expenses.length===0?<p className="text-sm text-gray-500 text-center py-2">Нет расходов</p>:
<div className="space-y-1">
{i.expenses.map(e=>(
<div key={e.id} className="flex items-center justify-between p-2 bg-white rounded">
<div className="flex items-center gap-2 flex-1">
<span>{e.is_cash?'💵':'💳'}</span>
<span className="font-medium">{e.category}</span>
{e.description&&<span className="text-sm text-gray-500">— {e.description}</span>}
</div>
<div className="flex items-center gap-2">
<span className="font-semibold text-red-600">{fmt(e.amount)}</span>
<Button variant="ghost" size="sm" onClick={()=>edit(e)}><Edit className="h-3 w-3"/></Button>
<Button variant="ghost" size="sm" onClick={()=>del(e.id)}><Trash2 className="h-3 w-3 text-red-600"/></Button>
</div>
</div>
))}
</div>
}
</div>
)}
</div>
);
})}
</div>
</CardContent>
</Card>
</TabsContent>

<TabsContent value="analytics" className="space-y-6">
<Card className="backdrop-blur-xl bg-gradient-to-r from-blue-50 to-purple-50 border shadow-lg">
<CardContent className="p-6">
<div className="flex items-center gap-2 mb-4">
<Target className="h-5 w-5 text-blue-600"/>
<h3 className="font-semibold text-gray-900">Прогноз доходов</h3>
</div>
<div className="grid grid-cols-3 gap-4">
<div><p className="text-sm text-gray-600">Получено (завершён)</p><p className="text-2xl font-bold text-green-600">{fmt(stats.cInc)}</p></div>
<div><p className="text-sm text-gray-600">Ожидается (в работе)</p><p className="text-2xl font-bold text-blue-600">{fmt(stats.wInc)}</p></div>
<div><p className="text-sm text-gray-600">Потенциал (победа)</p><p className="text-2xl font-bold text-purple-600">{fmt(stats.pInc)}</p></div>
</div>
<div className="mt-4 pt-4 border-t">
<div className="flex justify-between items-center">
<p className="font-semibold text-gray-900">ПРОГНОЗ ДОХОДА:</p>
<p className="text-3xl font-bold text-blue-600">{fmt(stats.totInc)}</p>
</div>
</div>
</CardContent>
</Card>

<Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-6">
<div className="flex items-center gap-2 mb-4">
<PieChart className="h-5 w-5 text-orange-600"/>
<h3 className="font-semibold text-gray-900">Куда тратим деньги</h3>
</div>
{Object.keys(stats.cats).length===0?<p className="text-center text-gray-500 py-4">Нет расходов</p>:
<div className="space-y-3">
{Object.entries(stats.cats).sort(([,a],[,b])=>b-a).map(([cat,amt])=>{
const pct=(amt/stats.totExp)*100;
return (
<div key={cat}>
<div className="flex justify-between text-sm mb-1">
<span className="font-medium">{cat}</span>
<span className="text-gray-700">{fmt(amt)} ({pct.toFixed(0)}%)</span>
</div>
<div className="bg-gray-200 rounded-full h-2">
<div className="bg-blue-500 h-2 rounded-full" style={{width:`${pct}%`}}/>
</div>
</div>
);
})}
</div>
}
</CardContent>
</Card>

<Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
<CardContent className="p-6">
<div className="flex items-center gap-2 mb-4">
<BarChart3 className="h-5 w-5 text-green-600"/>
<h3 className="font-semibold text-gray-900">Рейтинг проектов</h3>
</div>
<div className="grid grid-cols-2 gap-6">
<div>
<h4 className="text-sm font-semibold text-green-600 mb-2">ТОП-3 ПРИБЫЛЬНЫХ</h4>
{filtered.map(i=>({...i,profit:(i.tender.win_price||0)-i.expenses.reduce((s,e)=>s+e.amount,0)}))
.sort((a,b)=>b.profit-a.profit).slice(0,3).map((item,idx)=>(
<div key={item.tender.id} className="flex items-center justify-between py-2 border-b">
<div className="flex items-center gap-2">
<span className="font-bold text-gray-400">{idx+1}.</span>
<span className="text-sm">{item.tender.name}</span>
</div>
<span className="font-semibold text-green-600">{fmt(item.profit)}</span>
</div>
))}
</div>
<div>
<h4 className="text-sm font-semibold text-red-600 mb-2">ТОП УБЫТОЧНЫЙ</h4>
{filtered.map(i=>({...i,profit:(i.tender.win_price||0)-i.expenses.reduce((s,e)=>s+e.amount,0)}))
.filter(i=>i.profit<0).sort((a,b)=>a.profit-b.profit).slice(0,1).map(item=>(
<div key={item.tender.id} className="flex items-center justify-between py-2 border-b">
<span className="text-sm">{item.tender.name}</span>
<span className="font-semibold text-red-600">{fmt(item.profit)}</span>
</div>
))}
{filtered.every(i=>(i.tender.win_price||0)-i.expenses.reduce((s,e)=>s+e.amount,0)>=0)&&<p className="text-sm text-gray-500">Нет убыточных 🎉</p>}
</div>
</div>
</CardContent>
</Card>

<Card className="backdrop-blur-xl bg-yellow-500/10 border-l-4 border-l-yellow-500">
<CardContent className="p-4">
<p className="text-sm text-yellow-800">
<span className="font-bold">📊 Графики</span> доходов/расходов по месяцам будут добавлены в следующей версии
</p>
</CardContent>
</Card>
</TabsContent>
</Tabs>

<Card className="mt-6 backdrop-blur-xl bg-blue-500/10 border-l-4 border-l-blue-500">
<CardContent className="p-4">
<p className="text-sm text-blue-800">
<span className="font-bold">🧪 Тестовая версия:</span> Основная бухгалтерия на <a href="/accounting" className="underline">/accounting</a>
</p>
</CardContent>
</Card>
</div>
);
}
