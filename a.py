import pygame
import random
import sys

ROWS = 8
COLS = 8
MINES = 10
CELL_SIZE = 50
TOP = 60

WIDTH = COLS * CELL_SIZE
HEIGHT = ROWS * CELL_SIZE + TOP

class Cell:
    def __init__(self):
        self.is_mine = False
        self.is_open = False
        self.is_flagged = False
        self.count = 0
        self.exploded = False   

class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Minesweeper")
        self.font = pygame.font.SysFont(None, 28)
        self.big_font = pygame.font.SysFont(None, 40)
        self.board = []
        self.reset()

    def reset(self):
        self.board = [[Cell() for _ in range(COLS)] for _ in range(ROWS)]
        self.game_over = False
        self.win = False
        self.place_mines()
        self.calculate_counts()

    def place_mines(self):
        placed = 0
        while placed < MINES:
            r = random.randint(0, ROWS - 1)
            c = random.randint(0, COLS - 1)
            if not self.board[r][c].is_mine:
                self.board[r][c].is_mine = True
                placed += 1

    def calculate_counts(self):
        for r in range(ROWS):
            for c in range(COLS):
                if self.board[r][c].is_mine:
                    continue
                count = 0
                for dr in [-1, 0, 1]:
                    for dc in [-1, 0, 1]:
                        if dr == 0 and dc == 0:
                            continue
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < ROWS and 0 <= nc < COLS:
                            if self.board[nr][nc].is_mine:
                                count += 1
                self.board[r][c].count = count

    def reveal_mines(self):
        for r in range(ROWS):
            for c in range(COLS):
                if self.board[r][c].is_mine:
                    self.board[r][c].is_open = True

    def check_win(self):
        for r in range(ROWS):
            for c in range(COLS):
                cell = self.board[r][c]
                if not cell.is_mine and not cell.is_open:
                    return False
        return True

    def open_cell(self, r, c):
        if self.game_over or self.win:
            return

        cell = self.board[r][c]
        if cell.is_open or cell.is_flagged:
            return

        cell.is_open = True

        if cell.is_mine:
            cell.exploded = True
            self.game_over = True
            self.reveal_mines()
            return

        if cell.count == 0:
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < ROWS and 0 <= nc < COLS:
                        if not (dr == 0 and dc == 0):
                            self.open_cell(nr, nc)

        if self.check_win():
            self.win = True

    def draw_header(self):
        pygame.draw.rect(self.screen, (200, 200, 200), (0, 0, WIDTH, TOP))

        if self.game_over:
            text = self.big_font.render("GAME OVER - Press R to restart", True, (200, 0, 0))
        elif self.win:
            text = self.big_font.render("YOU WIN - Press R to restart", True, (0, 150, 0))
        else:
            text = self.font.render("Left click: Open | Right click: Flag | R: Restart", True, (0, 0, 0))

        text_rect = text.get_rect(center=(WIDTH // 2, TOP // 2))
        self.screen.blit(text, text_rect)

    def draw(self):
        self.screen.fill((220, 220, 220))
        self.draw_header()

        for r in range(ROWS):
            for c in range(COLS):
                x = c * CELL_SIZE
                y = r * CELL_SIZE + TOP
                rect = pygame.Rect(x, y, CELL_SIZE, CELL_SIZE)
                cell = self.board[r][c]

                if cell.is_open:
                    if cell.exploded:
                        pygame.draw.rect(self.screen, (255, 80, 80), rect) 
                        pygame.draw.circle(self.screen, (120, 0, 0), (x + 25, y + 25), 14)
                        pygame.draw.circle(self.screen, (255, 220, 0), (x + 25, y + 25), 6)  
                    else:
                        pygame.draw.rect(self.screen, (230, 230, 230), rect)
                        if cell.is_mine:
                            pygame.draw.circle(self.screen, (0, 0, 0), (x + 25, y + 25), 10)
                        elif cell.count > 0:
                            text = self.font.render(str(cell.count), True, (0, 0, 0))
                            self.screen.blit(text, (x + 18, y + 12))
                else:
                    pygame.draw.rect(self.screen, (180, 180, 180), rect)
                    if cell.is_flagged:
                        text = self.font.render("F", True, (0, 0, 200))
                        self.screen.blit(text, (x + 18, y + 12))

                pygame.draw.rect(self.screen, (100, 100, 100), rect, 1)

        pygame.display.flip()

    def run(self):
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()

                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r:
                        self.reset()

                if event.type == pygame.MOUSEBUTTONDOWN:
                    if self.game_over or self.win:
                        continue

                    x, y = event.pos
                    if y > TOP:
                        r = (y - TOP) // CELL_SIZE
                        c = x // CELL_SIZE

                        if 0 <= r < ROWS and 0 <= c < COLS:
                            if event.button == 1:
                                self.open_cell(r, c)
                            elif event.button == 3:
                                cell = self.board[r][c]
                                if not cell.is_open:
                                    cell.is_flagged = not cell.is_flagged

            self.draw()

Game().run()