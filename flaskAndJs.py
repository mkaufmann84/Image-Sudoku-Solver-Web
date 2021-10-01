import re
import flask
from flask import Flask, render_template, request, redirect
app = Flask(__name__)

import copy



from PIL import Image
from solver_class import ws


@app.route('/')  #what path 
def home():
   return render_template('web_js.html')

@app.route('/reset', methods=["GET"])
def reset():
   return render_template('web_js.html')



@app.route("/solve", methods=['GET','POST'])
def register():
   cv = {(row,col):'0' for row in range(9) for col in range(9)}
   for row in range(9):
      for colum in range(9):
         var = request.args.get(f"{row}{colum}")
         if var not in ["1","2","3","4","5","6","7","8","9",""]:
            return "One of your inputs contains an invalid character"
         if var =="":
            cv[(row,colum)] = "0"
         else:
            cv[(row,colum)] = var

   sol = ws(cv)
   print(cv)
   solution = sol.init_solve()
   if solution ==False:
      return "No solution"
   print("Done")
   sdict = {f'n{row}{col}':solution[row][col] for row in range(9) for col in range(9)}
   return render_template('grid_values.html',**sdict)


   

if __name__ == '__main__':
   app.run() #live updates