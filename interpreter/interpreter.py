import re
import constants
import json
import sys
import Gcode_exceptions
from os.path import basename, splitext


class Command:
    '''
    define object for a command (one line of Gcode)
    '''

    def __init__(self, command='', arguments={}, line=''):
        '''
        input:
            command: command type, i.e. 'G0'
            arguments: dictionary mapping parameter type to number, i.e. X123 -> {'X':'123'}
            line: line of Gcode, if this is given it will be parsed to get command and arguments.
                    This will overwrite the previous two inputs.

        attributes:
            self.command: (string) command type
            self.arguments: dictionary of arguments, given by input or parsed from gcode line
            self.letter: (string) command letter, i.e. 'G0' -> 'G'
            self.number: (string) command number, i.e. 'G0' -> '0'

        If an error is encountered, line is invalid and raise InvalidLine.
        Note: error checking is only done when parsing a line, if you pass in custom command and
        argument, make sure there are no errors.

        **This is not a compiler**, it is not guaranteed to find all Gcode errors
        '''
        line = line.upper()
        if line:
            try:
            	line = self.remove_comments(line)
                self.command = self.parse_command(line)
                self.arguments = self.parse_arguments(line)
            except Gcode_exceptions.GcodeError:
                raise Gcode_exceptions.InvalidLine
        else:
            self.command = str(command)
            self.arguments = arguments
        self.letter, self.number = re.findall(r'([A-Z])([0-9]*)', self.command)[0]

    def remove_comments(self, line):
        '''
        input:
            line: string of line of Gcode 
        output: 
            string of line of Gcode with comments removed
        '''
        for delimiter in constants.comment_delimiter:
            comment_index = line.find(delimiter)
            if comment_index >= 0:
                line = line[:comment_index]
        return line

    def parse_command(self, line):
        '''
        input:
            line: string of line of Gcode
        output:
            string of command, i.e. 'G0'

        raise command error if command does not match
        '''
        command = line.split()[0]
        if re.match(r'[A-Z][0-9]+', command):
            return command
        else:
            raise Gcode_exceptions.CommandError('invalid command')

    def parse_arguments(self, line):
        '''
        input:
            line: string of line of Gcode
        output:
            dictionary of arguments mapping parameter type to number, i.e. X123 -> {'X':'123'}

        raise SyntaxError if there are syntax errors
        '''
        arguments = {}
        args = line.split()[1:]
        for arg in args:
            try:
                letter, number = re.findall(r'([A-Z])([0-9.-]*)', arg)[
                    0]  # TODO check if Gcode only contains alphanumeric and .-
            except:
                raise Gcode_exceptions.SyntaxError('arguments')
            arguments[letter] = number
        return arguments

    def get_english(self):
        '''
        return the english description of this command
        '''
        try:
            eng_desc = ''
            eng_desc += constants.common_comm[self.command]
            for argument in self.arguments:
                eng_desc += ';' + constants.arguments[argument.lower()][self.command] + self.arguments[argument]
            return eng_desc
        except KeyError:
            # invalid command
            raise Gcode_exceptions.CommandError

        # TODO: handle multiple commands on same line


line_list = []
point_list = []

######################## NERLA'S FUNCTION ##########################
def interpret_gcode(l):
    '''
    input:
        l: string of line of Gcode
    output:
        tuple of point (x,y,z) of movement, and boolean indicating if drawing or not 
        ex) ((1,2,3), True)
        
        if command is not a draw command (like any of the M commands), return None
    '''
    global line_list, point_list
    l = l.strip()
    if l and not l[0] in constants.comment_delimiter and not l.isspace():
        l = Command(line=l)
    else:
        return None
    if l.letter == 'G' and l.number == '1':
        p = [None, None, None]
        for key in l.arguments:
            if key == 'X':
                p[0] = float(l.arguments[key])
            elif key == 'Y':
                p[1] = float(l.arguments[key])
            elif key == 'Z':
                p[2] = float(l.arguments[key])
        if p[0] is None:
            if len(line_list) > 0:
                p[0] = line_list[len(line_list) - 1][0]
            else:
                raise Gcode_exceptions.UndefinedPoint
        if p[1] is None:
            if len(line_list) > 0:
                p[1] = line_list[len(line_list) - 1][1]
            else:
                raise Gcode_exceptions.UndefinedPoint
        if p[2] is None:
            if len(line_list) > 0:
                p[2] = line_list[len(line_list) - 1][2]
            else:
                raise Gcode_exceptions.UndefinedPoint
        line_list.append(p)
        return (p, True)
    elif l.letter == 'G' and l.number == '28':
        line_list.append([0, 0, 0])
        return ([0,0,0], True)
    elif l.letter == 'G' and l.number == '1':
        point_list.append(line_list)
        line_list = []
    elif l.letter == 'G' and l.number == '21':
        pass
    elif l.letter == 'G' and l.number == '90':
        pass
    elif l.letter == 'M' and l.number == '127':
        pass
    elif l.letter == 'M' and l.number == '73':
        pass
    elif l.letter == 'M' and l.number == '104':
        pass
    elif l.letter == 'M' and l.number == '126':
        pass
    elif l.letter == 'M' and l.number == '84':
        pass
    else:
        raise Gcode_exceptions.UndefinedInstruction(l)

################# AUSTIN'S SPACE ########################

def parse_commands(gcode):
    '''
    input:
        gcode: text string of entire Gcode file
    '''
    lines = gcode.split('\n')
    # initialize gcodeline -> point dict
    for i in range(1, len(lines) + 1):
        constants.gcodeline_point[i] = None
    current_head = [0.0,0.0,0.0]
    for i in range(len(lines)):
        line = lines[i]
    	interpretation = interpret_gcode(line)
        if interpretation:
            p, draw = interpretation
            draw_line(p, draw)
            constants.gcodeline_point[i+1] = (current_head,p)
            current_head = p
    return

def draw_line(p, draw):
	'''
	input:
        p: endpoint (x,y,z) to draw line to (starting at current position)
        draw: boolean indicating whether or not to draw 

	wrapper function for draw line
	'''
	pass

'''
dictionaries
- gcode line -> point
- point -> gcode line
'''
##########################################################

# with open(outfilename , 'w') as outfile:
# 	json.dump(point_list, outfile, indent=4,separators=(',',': '))

if __name__ == '__main__':
    # main function for testing purposes
    with open(sys.argv[1]) as f:
        parse_commands(f.read())
    print constants.gcodeline_point
    print "done"
