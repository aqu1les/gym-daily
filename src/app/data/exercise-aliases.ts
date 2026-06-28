// src/app/data/exercise-aliases.ts
// normName -> datasetId. Ids resolvidos manualmente contra exercises.slim.json
// Keys are lowercase with no accents (output of normalize()).
export const ALIASES: Record<string, string> = {
  'remada curvada com barra':       '0027', // Remada curvada com barra | barra | costas (superior)
  'crucifixo invertido':            '0378', // crucifixo invertido com halteres | halteres | deltoides
  'hip thrust':                     '1409', // elevação pélvica com barra | barra | glúteos
  'mesa flexora':                   '0586', // mesa flexora deitada na máquina de alavanca | máquina | posteriores de coxa
  'extensora':                      '0585', // cadeira extensora na máquina de alavanca | máquina | quadríceps
  'flexora':                        '0599', // mesa flexora sentada na máquina de alavanca | máquina | posteriores de coxa
  'elevacao lateral':               '0334', // elevação lateral com halteres | halteres | deltoides
  'elevacao frontal':               '0310', // elevação frontal com halteres | halteres | deltoides
  'panturrilha sentado':            '0594', // elevação de panturrilha sentada na máquina | máquina | panturrilhas
  'supino inclinado com halteres':  '0314', // supino inclinado com halteres | halteres | peitorais
  'rosca alternada':                '0285', // rosca direta alternada com halteres | halteres | bíceps
  'triceps frances':                '1749', // extensão de tríceps em pé com barra EZ (francês) | barra W | tríceps
  'stiff com barra':                '0085', // stiff com barra | barra | glúteos
  'leg press':                      '0739', // Leg Press 45° | leg press/sled | glúteos
  'desenvolvimento maquina':        '0603', // desenvolvimento na máquina de alavanca | máquina | deltoides
  'crucifixo inclinado':            '0319', // crucifixo inclinado com halteres | halteres | peitorais
  'rosca martelo':                  '0313', // rosca martelo com halteres | halteres | bíceps
  'smith':                          '0750', // Agachamento Cadeira no Smith | smith | quadríceps
  'puxada neutra':                  '0818', // puxada com pegada paralela dupla | cabo/polia | dorsais
  'triceps corda':                  '0200', // Tríceps na polia com corda | cabo/polia | tríceps
  'rosca na polia':                 '0868', // Rosca na polia | cabo/polia | bíceps
  'rosca na polia baixa':           '0868', // Rosca na polia | cabo/polia | bíceps
  'supino inclinado com barra':     '0047', // supino inclinado com barra | barra | peitorais
  'leg press horizontal':           '2611', // leg press unilateral horizontal na máquina | máquina | glúteos
  'agachamento hack':               '0743', // Hack Squat no Sled | leg press/sled | glúteos
  'triceps testa':                  '0060', // tríceps testa deitado com barra | barra | tríceps
  'puxada frontal':                 '0579', // puxada frontal na máquina de alavanca | máquina | dorsais
  'panturrilha':                    '0605', // elevação de panturrilha em pé na máquina de alavanca | máquina | panturrilhas
  'supino reto':                    '0025', // Supino com barra | barra | peitorais
  'desenvolvimento arnold':         '2137', // desenvolvimento arnold com halteres | halteres | deltoides
  'remada polia baixa':             '0180', // Remada baixa sentado na polia | cabo/polia | costas (superior)
};
