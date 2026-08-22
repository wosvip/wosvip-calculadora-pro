"use strict";
const PYODIDE_BASE="https://cdn.jsdelivr.net/pyodide/v0.29.4/full/";
let readyPromise=null;
function boot(){
  if(readyPromise)return readyPromise;
  readyPromise=(async()=>{
    importScripts(PYODIDE_BASE+"pyodide.js");
    const pyodide=await loadPyodide({indexURL:PYODIDE_BASE});
    await pyodide.loadPackage("sympy");
    await pyodide.runPythonAsync(`
import json, re
from sympy import symbols, factor, cancel, together, fraction, solve, Eq, simplify, expand
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

TRANSFORMS = standard_transformations + (implicit_multiplication_application, convert_xor)
ALLOWED = re.compile(r"^[0-9a-zA-Z_+\\-*/^().,\\s]+$")
x, y, z = symbols("x y z")
LOCAL = {"x": x, "y": y, "z": z}

def txt(value):
    return str(value).replace("**", "^")

def sorted_values(values):
    unique = []
    for value in values:
        text = txt(value)
        if text not in unique:
            unique.append(text)
    return unique

def solve_wosvip(source):
    source = str(source or "").strip()
    if not source or len(source) > 500 or not ALLOWED.match(source):
        raise ValueError("Expressão não suportada pelo motor avançado.")
    normalized = source.replace("^", "**")
    expression = parse_expr(normalized, local_dict=LOCAL, transformations=TRANSFORMS, evaluate=False)
    depth = 0
    division_at = -1
    for position, character in enumerate(normalized):
        if character == "(":
            depth += 1
        elif character == ")":
            depth -= 1
        elif character == "/" and depth == 0:
            division_at = position
            break
    if division_at >= 0:
        numerator_source = normalized[:division_at]
        denominator_source = normalized[division_at + 1:]
        original_num = parse_expr(numerator_source, local_dict=LOCAL, transformations=TRANSFORMS, evaluate=False)
        original_den = parse_expr(denominator_source, local_dict=LOCAL, transformations=TRANSFORMS, evaluate=False)
    else:
        original_num, original_den = fraction(expression)
    combined = original_num / original_den
    simplified = cancel(combined)
    final_num, final_den = fraction(simplified)
    factored_num = factor(original_num)
    factored_den = factor(original_den)
    variables = sorted(expression.free_symbols, key=lambda item: item.name)
    restrictions = []
    for variable in variables:
        try:
            restrictions.extend(solve(Eq(original_den, 0), variable))
        except Exception:
            pass
    restrictions = sorted_values(restrictions)
    verified = simplify(expression - simplified) == 0
    steps = [{"title": "Vamos simplificar a expressão", "math": source}]
    if original_den != 1:
        if factored_num != original_num:
            steps.append({"title": "Fatoramos o numerador", "math": txt(expand(original_num))+" = "+txt(factored_num)})
        if factored_den != original_den:
            steps.append({"title": "Fatoramos o denominador", "math": txt(expand(original_den))+" = "+txt(factored_den)})
        if factored_num != original_num or factored_den != original_den:
            steps.append({"title": "Substituímos as formas fatoradas", "math": "("+txt(factored_num)+")/("+txt(factored_den)+")"})
        if factored_num != original_num or factored_den != original_den or simplified != combined:
            steps.append({"title": "Cancelamos o fator comum", "math": "("+txt(factored_num)+")/("+txt(factored_den)+")", "after": txt(simplified)})
    elif factor(expression) != expression:
        steps.append({"title": "Fatoramos a expressão", "math": txt(expression)+" = "+txt(factor(expression))})
    if simplified == combined and factored_num == original_num and factored_den == original_den and original_den != 1:
        steps.append({"title": "A expressão já está na forma reduzida", "math": txt(simplified)})
    steps.append({"title": "Portanto, o resultado é", "math": txt(simplified), "result": True})
    explanation = ""
    if restrictions:
        joined = " e ".join((variables[0].name if len(variables)==1 else "valor")+" ≠ "+value for value in restrictions)
        explanation = "Esses valores continuam proibidos porque anulavam o denominador da expressão original."
        steps.append({"title": "Restrições da expressão original", "text": joined, "note": explanation})
    return json.dumps({"ok": True, "result": txt(simplified), "verified": bool(verified), "steps": steps}, ensure_ascii=False)
`);
    return pyodide;
  })();
  return readyPromise;
}
self.onmessage=async event=>{
  const {id,expression}=event.data||{};
  try{
    const pyodide=await boot();
    pyodide.globals.set("wosvip_source",expression);
    const raw=await pyodide.runPythonAsync("solve_wosvip(wosvip_source)");
    self.postMessage({id,...JSON.parse(raw)});
  }catch(error){
    readyPromise=null;
    self.postMessage({id,ok:false,error:error&&error.message?error.message:String(error)});
  }
};