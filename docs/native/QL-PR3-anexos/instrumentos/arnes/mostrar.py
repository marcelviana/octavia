import os, sys, runpy, time
inst, serial, estado = sys.argv[1], sys.argv[2], sys.argv[3]
sys.argv = [sys.argv[0], inst, serial, "/tmp", "tab"]
g = runpy.run_path("/Users/marcelviana/projects/octavia-ql-pr3/docs/native/QL-PR3-anexos/instrumentos/ql.py", run_name="ql")
q = g["QL"](serial, os.environ["W"] + "/run/ql/julgamentos", "QL3J", "tab")
if estado == "pe22":
    q.palco(1, "ret")
elif estado == "deitado40":
    q.palco(1, "pai"); q.zoom(3)
elif estado == "ancora":
    q.palco(3, "ret")
elif estado == "v":
    g["orientar"](serial, "tab", "pai"); q._abrir_v("Lanterna", "Lanterna da fixture")
print("pronto:", estado)
