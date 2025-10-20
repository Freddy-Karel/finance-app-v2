const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    outputFile: 'projet-complet.txt',
    includedExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.prisma'],
    excludedDirs: ['node_modules', '.git', 'build', 'dist', '.next', '.vscode', 'coverage'],
    maxFileSize: 50000 // 50KB max
};

function generateProjectReport() {
    console.log('📁 Analyse de la structure du projet...');
    
    let content = `# RAPPORT COMPLET DU PROJET\n`;
    content += `Généré le: ${new Date().toLocaleString('fr-FR')}\n\n`;
    
    let fileCount = 0;

    // Fonction pour lire récursivement les dossiers
    function readDirectory(currentPath, depth = 0) {
        try {
            const items = fs.readdirSync(currentPath);
            
            // Trier: dossiers d'abord, puis fichiers
            items.sort((a, b) => {
                const aPath = path.join(currentPath, a);
                const bPath = path.join(currentPath, b);
                try {
                    const aIsDir = fs.statSync(aPath).isDirectory();
                    const bIsDir = fs.statSync(bPath).isDirectory();
                    return bIsDir - aIsDir || a.localeCompare(b);
                } catch {
                    return 0;
                }
            });

            items.forEach(item => {
                const fullPath = path.join(currentPath, item);
                const relativeItemPath = path.relative('.', fullPath);
                
                // Ignorer les dossiers exclus
                if (CONFIG.excludedDirs.includes(item)) return;
                
                try {
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        // Afficher le dossier
                        content += `${'  '.repeat(depth)}📁 ${item}/\n`;
                        readDirectory(fullPath, depth + 1);
                    } else {
                        // Vérifier l'extension du fichier
                        const ext = path.extname(item);
                        if (CONFIG.includedExtensions.includes(ext)) {
                            fileCount++;
                            
                            content += `${'  '.repeat(depth)}📄 ${item}`;
                            
                            // Ajouter le contenu pour les petits fichiers
                            if (stats.size < CONFIG.maxFileSize) {
                                try {
                                    const fileContent = fs.readFileSync(fullPath, 'utf8');
                                    content += ` (${stats.size} bytes)\n`;
                                    content += `${'  '.repeat(depth + 1)}📍 Chemin: ${relativeItemPath}\n`;
                                    content += `${'  '.repeat(depth + 1)}\`\`\`${ext.substring(1) || 'text'}\n`;
                                    content += fileContent;
                                    content += `\n${'  '.repeat(depth + 1)}\`\`\`\n`;
                                } catch (readError) {
                                    content += ` ❌ Erreur lecture: ${readError.message}\n`;
                                }
                            }
                        }
                    }
                } catch (error) {
                    content += `${'  '.repeat(depth)}❌ ${item}: ${error.message}\n`;
                }
            });
        } catch (error) {
            content += `❌ Impossible de lire le dossier: ${currentPath}\n`;
        }
    }

    // Démarrer l'analyse à partir du dossier courant
    readDirectory('.');

    // Résumé
    content += `\n## 📊 RÉSUMÉ\n`;
    content += `Fichiers inclus: ${fileCount}\n`;
    content += `Terminé à: ${new Date().toLocaleString('fr-FR')}\n`;

    // Sauvegarder
    fs.writeFileSync(CONFIG.outputFile, content, 'utf8');
    console.log(`✅ Fichier généré: ${CONFIG.outputFile}`);
    console.log(`📊 ${fileCount} fichiers traités`);
}

// Helper pour déterminer le langage
function getLanguage(extension) {
    const languages = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.css': 'css',
        '.scss': 'scss',
        '.html': 'html',
        '.json': 'json',
        '.prisma': 'prisma'
    };
    return languages[extension] || 'text';
}

// Version focalisée sur les dossiers importants de ton projet
function generateFocusedReport() {
    console.log('🎯 Génération du rapport focalisé...');
    
    const importantPaths = [
        'apps/frontend/src',
        'apps/backend/src',
        'apps/backend/prisma',
        'package.json',
        'tsconfig.json'
    ];

    let content = `# RAPPORT FOCALISÉ - PROJET REACT/NESTJS\n`;
    content += `Généré le: ${new Date().toLocaleString('fr-FR')}\n\n`;
    
    let fileCount = 0;

    importantPaths.forEach(itemPath => {
        if (fs.existsSync(itemPath)) {
            content += `\n## 📂 ${itemPath.toUpperCase()}\n`;
            
            if (fs.statSync(itemPath).isDirectory()) {
                processImportantDirectory(itemPath, itemPath);
            } else {
                processImportantFile(itemPath, itemPath);
            }
        }
    });

    content += `\n## 📊 RÉSUMÉ\n`;
    content += `Total fichiers: ${fileCount}\n`;
    
    fs.writeFileSync('rapport-focalise.txt', content);
    console.log('✅ Rapport focalisé généré: rapport-focalise.txt');

    function processImportantDirectory(fullPath, relativePath, depth = 0) {
        try {
            const items = fs.readdirSync(fullPath);
            
            items.forEach(item => {
                const itemFullPath = path.join(fullPath, item);
                const itemRelativePath = path.join(relativePath, item);
                
                if (CONFIG.excludedDirs.includes(item)) return;
                
                try {
                    const stat = fs.statSync(itemFullPath);
                    
                    if (stat.isDirectory()) {
                        content += `${'  '.repeat(depth)}📁 ${item}/\n`;
                        processImportantDirectory(itemFullPath, itemRelativePath, depth + 1);
                    } else {
                        const ext = path.extname(item);
                        if (CONFIG.includedExtensions.includes(ext)) {
                            fileCount++;
                            content += `${'  '.repeat(depth)}📄 ${itemRelativePath}\n`;
                            
                            if (stat.size < CONFIG.maxFileSize) {
                                try {
                                    const fileContent = fs.readFileSync(itemFullPath, 'utf8');
                                    content += '```' + getLanguage(ext) + '\n';
                                    content += fileContent;
                                    content += '\n```\n\n';
                                } catch (e) {
                                    content += '❌ Erreur lecture\n\n';
                                }
                            }
                        }
                    }
                } catch (error) {
                    content += `❌ ${itemRelativePath}\n`;
                }
            });
        } catch (error) {
            content += `❌ Dossier inaccessible: ${fullPath}\n`;
        }
    }

    function processImportantFile(filePath, relativePath) {
        try {
            const stat = fs.statSync(filePath);
            const ext = path.extname(filePath);
            fileCount++;
            
            content += `📄 ${relativePath}\n`;
            
            if (stat.size < CONFIG.maxFileSize) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                content += '```' + getLanguage(ext) + '\n';
                content += fileContent;
                content += '\n```\n\n';
            }
        } catch (error) {
            content += `❌ Fichier inaccessible: ${relativePath}\n`;
        }
    }
}

// Détection automatique du type de rapport
if (require.main === module) {
    if (process.argv.includes('--focused') || process.argv.includes('-f')) {
        generateFocusedReport();
    } else {
        generateProjectReport();
    }
}

module.exports = { generateProjectReport, generateFocusedReport };
