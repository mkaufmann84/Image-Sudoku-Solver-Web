import copy

class ws:
    sq = [[(0, 0), (0, 1), (0, 2), (1, 0), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)], [(3, 0), (3, 1), (3, 2), (4, 0), (4, 0), (4, 1), (4, 2), (5, 0), (5, 1), (5, 2)], [(6, 0), (6, 1), (6, 2), (7, 0), (7, 0), (7, 1), (7, 2), (8, 0), (8, 1), (8, 2)], [(0, 3), (0, 4), (0, 5), (1, 3), (1, 3), (1, 4), (1, 5), (2, 3), (2, 4), (2, 5)], [(3, 6), (3, 7), (3, 8), (4, 6), (4, 6), (4, 7), (4, 8), (5, 6), (5, 7), (5, 8)], [(3, 3), (3, 4), (3, 5), (4, 3), (4, 3), (4, 4), (4, 5), (5, 3), (5, 4), (5, 5)], [(0, 6), (0, 7), (0, 8), (1, 6), (1, 6), (1, 7), (1, 8), (2, 6), (2, 7), (2, 8)], [(6, 3), (6, 4), (6, 5), (7, 3), (7, 3), (7, 4), (7, 5), (8, 3), (8, 4), (8, 5)], [(6, 6), (6, 7), (6, 8), (7, 6), (7, 6), (7, 7), (7, 8), (8, 6), (8, 7), (8, 8)]]
    def __init__(self,cv):
        self.cv = cv
        self.ftime = True

    def init_solve(self):
        #initializes solving
        
        self.initial_cv = copy.deepcopy(self.cv)
        initial_cd = self.domains(self.initial_cv)
        initial_grid = self.creategrid(self.initial_cv)
        print('Initial:')
        print(*initial_grid,sep='\n')
        

        self.result = self.solve(self.initial_cv,initial_cd,initial_grid)
        #print('Result:')
        #print(*self.result,sep='\n')
        return self.result
              
        
    def creategrid(self,cv): 
        #creates grid based off cv
        grid = []
        for v in range(9):
            tmp = []
            for h in range(9):
                tmp.append(cv[(v,h)])
            grid.append(tmp)
        return grid

                
    def domains(self,cv): 
        #initalizes self.cd
        cd = dict()
        base = {'1','2','3','4','5','6','7','8','9'}
        for i in cv:
            if cv[i]=='0':
                cd[i] = base.copy()
            else:
                cd[i] = set() #there is already a known valuye
        return cd
       
    def solve(self,cv,cd,grid): #v,h
        #this functions uses basic inferences made from the board to speed up the solver. 
        cv = copy.deepcopy(cv)
        cd = copy.deepcopy(cd)
    
        checkcv = copy.copy(cv)
        checkcd = copy.copy(cd)
        checkgrid = copy.copy(grid)
        did_work = self.is_puzzle_solved(grid)
        if did_work==None: #there is a cell with a value that has yet to be solved.
            for i in cv:
                if cv[i] =='0':
                    row = grid[i[0]]
                    
                    for value in row:
                        if len(cd[i]) ==1:
                            p = cd[i].pop()
                            cv[i] = p
                            return self.solve(cv,cd,grid)
                        cd[i].discard(value) 
                    col = [grid[num][i[1]] for num in range(9)]
                    for value in col:
                        if len(cd[i]) ==1:
                            p = cd[i].pop()
                            cv[i] = p
                            return self.solve(cv,cd,grid)
                        cd[i].discard(value)
                    
                    box = [var for var in ws.sq if i in var]
                    boxvalues = [cv[va] for va in box[0]]
                    for value in boxvalues:
                        if len(cd[i]) ==1:
                            p = cd[i].pop()
                            cv[i] = p
                            return self.solve(cv,cd,grid)
                        cd[i].discard(value)

            if checkcv ==cv and checkcd ==cd and checkgrid == grid:
                return self.backtrack(cv,cd,grid) #stuck, need some help
            return self.solve(cv,cd,grid)  #domain values were changed
        elif did_work ==False: #puzzle is filled, but is not a real solution
            return False #backtrack did not work for this solution
        elif did_work==True:#puzzle is a valid solution
            return grid

        
        
    def backtrack(self,cv,cd,grid):
        #backtracking search algorithim. This is used when basic inferences(solve) can not find solution
        cv = copy.deepcopy(cv)
        cd = copy.deepcopy(cd)
        solved = self.unsolveable(cv,cd,self.creategrid(cv))
        if solved == True:
            return self.creategrid(cv)
        elif solved == False:
            return False

        var = self.select_unassigned_variable(cv,cd) #looks at variables that have already been assigned in assingment.:
        for value in cd[var]:
            cvcopy = copy.deepcopy(cv)
            cvcopy[var] = value
            result = self.is_puzzle_solved(self.creategrid(cvcopy))
            if result ==True:
                return self.creategrid(cvcopy)
            elif result ==False:
                cvcopy[var] = cv[var]
            else: #keep going, there is empty (result = none)
                result = self.solve(cvcopy,cd,self.creategrid(cvcopy))
                if result ==False:#grid no work, and flled
                    cvcopy[var] = cv[var]

                else:
                    return result
        return False

    def unsolveable(self,cv,cd,grid):
        #sees if puzzle is completed, and if it can be completed
        p = self.is_puzzle_solved(grid)
        if p== True:
            #puzzle is solved and filled
            return True
        elif p==False:
            #puzz filed but does not follow rules.
            return False
        elif p == None: #puzzle is not filled out
            #checks for:
            #Makes sure ther is still at least one cd for each coord with value 0
            for coordnite in cv:
                if cv[coordnite]=='0':
                    if len(cd[coordnite])==0:
                        return False #this is because a square could have no possible solution, so it is bad puzzle
            return None #as in no problem yet

            
    def is_puzzle_solved(self,board):
        #sees if puzzle is completed
        #checks if filled in
        for i in board: #i is row
            for ii in i: #ii is char
                if ii =='0':
                    return None
        # checks rows
        numset = {'1','2','3','4','5','6','7','8','9'}
        for row in board:
            if set(row) != numset:
                return False
        #checks col
        for col in range(9):
            tmp = []
            for row in range(9):
                tmp.append(board[row][col])

            if set(tmp) != numset:
                return False
        # checks box
        for box in ws.sq:
            tmp = []
            for i in box: #i is a coordnite
                tmp.append(board[i[0]][i[1]])
            if set(tmp) != numset:
                return False
            
        return True
    
    def select_unassigned_variable(self, cv,cd):
        #optimization for speed
        zeros = []
        for i in cv:
            if cv[i]=='0':
                zeros.append(i) #i is a coordnite, where the vlaue is 0
        smallest_domain = {i:100 for i in zeros}#10 cause thats a max value
        for i in smallest_domain:
            smallest_domain[i] = len(cd[i])
            
            
        v=list(smallest_domain.values())
        k=list(smallest_domain.keys())
        return k[v.index(min(v))]   
        


