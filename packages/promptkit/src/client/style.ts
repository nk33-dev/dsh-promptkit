// 颜色全部取宿主变量；不加自定义大阴影，焦点环只在键盘操作时出现。
export const css = `
.pk-tools{display:flex;align-items:center;gap:2px}
.pk-tool,.pk-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.pk-tool:hover,.pk-icon:hover:not(:disabled),.pk-tool[data-active]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pk-tool[aria-disabled=true]{opacity:.35;cursor:default;background:transparent}
.pk-library-tool{order:0}.pk-enhance-tool{order:1}
.pk-follow-row{display:flex;align-items:center;gap:8px;flex:none}.pk-follow-row .pk-follow{flex:1;min-width:0}
.pk-tool svg,.pk-icon svg{display:block;flex:none}
.pk-icon:disabled{opacity:.35;cursor:default}
.pk-tool:focus-visible,.pk-icon:focus-visible,.pk-button:focus-visible,.pk-input:focus-visible,.pk-tab:focus-visible,.pk-chip:focus-visible,.pk-link:focus-visible,.pk-grip:focus-visible,.pk-row-main:focus-visible,.pk-option:focus-visible,.pk-mode-menu button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.pk-flyout{position:fixed;inset:auto;margin:0;padding:0;z-index:1200}
.pk-flyout:not(:popover-open){display:none}
.pk-flyout::backdrop{background:transparent;pointer-events:none}
.pk-panel{box-sizing:border-box;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;font-size:13px;line-height:1.55;overflow:hidden}
.pk-menu{width:280px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;padding:4px}
.pk-mode-menu{display:flex;flex-direction:column;gap:2px}
.pk-mode-menu button{font:inherit;color:inherit;text-align:left;border:0;background:transparent;border-radius:8px;padding:7px 10px;cursor:pointer}
.pk-mode-menu button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.pk-mode-menu button[aria-disabled=true]{opacity:.5;cursor:default;background:transparent}
.pk-mode-menu [role=menuitem]{display:flex;align-items:center;gap:10px;padding:10px 12px}
.pk-mode-menu small{display:block;color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-mode-menu .pk-depth-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 5px 10px;margin-bottom:4px;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:12px;color:var(--dsw-alias-label-secondary)}
.pk-depth{display:flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px}
.pk-mode-menu .pk-depth button{padding:4px 9px;font-size:12px;text-align:center;color:var(--dsw-alias-label-secondary)}
.pk-mode-menu .pk-depth button[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.pk-flyout:focus{outline:none}
.pk-flyout button:focus{outline:none;box-shadow:none}
.pk-flyout[data-keyboard=true] button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.pk-mode-menu button:focus:not(:focus-visible),.pk-tool:focus:not(:focus-visible),.pk-option:focus:not(:focus-visible){outline:none;box-shadow:none}
.pk-card>.pk-workflow,.pk-card>.pk-library{flex:1;min-height:0;display:flex;flex-direction:column}
.pk-head{display:flex;align-items:center;gap:8px;padding:10px 10px 8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2);flex:none}
.pk-head h2{font-size:14px;font-weight:600;margin:0}
.pk-meta{color:var(--dsw-alias-label-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-grow{flex:1}
.pk-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:12px 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent}
.pk-foot{display:flex;align-items:center;gap:6px;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l2);flex:none;flex-wrap:wrap}
.pk-stale{display:flex;align-items:center;gap:10px;padding:8px 16px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);flex:none}
.pk-error-bar{display:flex;align-items:flex-start;gap:10px;padding:8px 16px;color:var(--dsw-alias-state-error-primary);border-top:1px solid var(--dsw-alias-border-l2);white-space:pre-wrap;overflow-wrap:anywhere;flex:none}
.pk-error-bar>span{flex:1}
.pk-link{font:inherit;font-size:13px;border:0;background:transparent;color:var(--dsw-alias-state-business-primary);padding:2px 4px;border-radius:4px;cursor:pointer;white-space:nowrap}
.pk-foot .pk-link{color:var(--dsw-alias-label-secondary)}
.pk-foot .pk-link:hover{color:var(--dsw-alias-label-primary)}
.pk-link:disabled{opacity:.45;cursor:default}
.pk-loading{display:flex;align-items:center;gap:10px;color:var(--dsw-alias-label-secondary);padding:20px 0}
.pk-spin{width:14px;height:14px;box-sizing:border-box;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-label-secondary);border-radius:50%;animation:pk-spin .8s linear infinite}
@keyframes pk-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.pk-spin{animation:none}}
.pk-question-row{display:flex;align-items:flex-start;gap:8px}
.pk-question{flex:1;font-size:14px;font-weight:600;line-height:1.5;margin:0;overflow-wrap:anywhere}
.pk-options{display:flex;flex-direction:column;gap:2px}
.pk-option{font:inherit;color:inherit;display:flex;align-items:flex-start;gap:10px;width:100%;box-sizing:border-box;text-align:left;padding:8px 10px;border:1px solid transparent;border-radius:8px;background:transparent;cursor:pointer}
.pk-option:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.pk-option[aria-checked=true]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}
.pk-option:disabled{opacity:.5;cursor:default}
.pk-option>span:last-child{min-width:0;overflow-wrap:anywhere}
.pk-option strong{font-weight:500}
.pk-option small{display:block;color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:2px}
.pk-option-number{display:inline-flex;align-items:center;justify-content:center;flex:none;width:22px;height:22px;border-radius:5px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:1px}
.pk-option-editing{align-items:center;border-color:var(--dsw-alias-state-business-primary);cursor:text}
.pk-option-editing input{flex:1;min-width:0;font:inherit;color:inherit;background:transparent;border:0;outline:none;padding:2px 0}
.pk-badge{color:var(--dsw-alias-state-business-primary);font-size:11px;margin-left:6px}
.pk-answered{list-style:none;margin:4px 0 0;padding:0;color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-answered li{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-answered span{color:var(--dsw-alias-label-primary)}
.pk-pager{display:inline-flex;align-items:center;gap:2px;color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-pager{min-width:0;max-width:100%;flex:0 1 auto}.pk-dots{display:flex;gap:4px;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent;padding:3px 1px;max-width:440px}
.pk-dot{font:inherit;font-size:11px;width:23px;height:23px;flex:none;border:1px solid var(--dsw-alias-border-l2);border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);padding:0;cursor:pointer}
.pk-dot[aria-current=step]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary)}
.pk-dot[data-answered=true]{background:var(--dsw-alias-interactive-bg-hover)}
.pk-decisions{position:sticky;bottom:0;display:flex;align-items:center;gap:12px;padding:12px 0 4px;background:var(--dsw-alias-bg-base);flex:none}.pk-decisions .pk-link{font-size:12px;color:var(--dsw-alias-label-secondary)}.pk-decisions [aria-pressed=true]{color:var(--dsw-alias-state-business-primary)}
.pk-basis{line-height:1.7;margin-bottom:2px}.pk-options{gap:8px}.pk-option{padding:12px 10px}.pk-head{padding:14px 18px}.pk-body{padding:18px;gap:16px}.pk-foot{padding:12px 18px}.pk-question{font-size:15px}
.pk-more{position:relative;font-size:12px}.pk-more summary{list-style:none;border:1px solid var(--dsw-alias-border-l2);padding:5px 10px;border-radius:8px}
.pk-more-menu{position:fixed;z-index:2;transform:translate(-95px,-135px);padding:5px;display:flex;flex-direction:column;gap:3px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:8px}
.pk-more-menu .pk-button{border:0;text-align:left}
.pk-summary{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.75;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover)}
.pk-body.is-result{overflow:hidden}
.pk-result{flex:1 1 280px;resize:none;min-height:60px;border:0;background:transparent;padding:2px;line-height:1.75;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent}
.pk-context{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default}
.pk-toast{display:flex;align-items:center;gap:12px;padding:7px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;white-space:nowrap}
.pk-card>.pk-toast{position:absolute;left:50%;bottom:52px;transform:translateX(-50%);z-index:1}
.pk-floating{border:0;background:transparent}
.pk-chips{display:flex;gap:6px;flex-wrap:wrap}
.pk-chip{font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:1px 10px;cursor:pointer}
.pk-chip:hover{color:var(--dsw-alias-label-primary)}
.pk-chip[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover-solid,var(--dsw-alias-interactive-bg-hover));border-color:transparent}
.pk-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.pk-row-item{position:relative;display:flex;align-items:flex-start;gap:4px;padding:2px 4px 2px 0;border-radius:8px}
.pk-row-item:hover,.pk-row-item:focus-within{background:var(--dsw-alias-interactive-bg-hover)}
.pk-row-item[data-dragging]{opacity:.4}
.pk-row-item[data-over]{box-shadow:inset 0 2px 0 var(--dsw-alias-state-business-primary)}
.pk-grip{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:28px;margin-top:4px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:grab;opacity:.55}
.pk-row-item:hover .pk-grip,.pk-grip:focus-visible{opacity:1}
.pk-row-main{flex:1;min-width:0;font:inherit;color:inherit;text-align:left;background:transparent;border:0;padding:6px 4px;cursor:pointer;border-radius:6px}
.pk-row-title{display:flex;align-items:center;gap:6px;min-width:0}
.pk-row-title strong{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-row-main small{display:block;color:var(--dsw-alias-label-secondary);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-pill{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);border-radius:999px;padding:0 7px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-row-actions{display:none;align-items:center;gap:1px;padding-top:5px;flex:none}
.pk-row-item:hover .pk-row-actions,.pk-row-item:focus-within .pk-row-actions{display:flex}
.pk-row-actions .pk-icon{width:26px;height:26px}
.pk-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--dsw-alias-label-secondary);padding:30px 12px;min-height:100px;text-align:center}
.pk-empty p{margin:0}
.pk-edit{gap:12px}
.pk-check{display:flex;align-items:center;gap:6px}
.pk-check input{accent-color:var(--dsw-alias-state-business-primary)}
.pk-button{font:inherit;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 12px;cursor:pointer;white-space:nowrap;min-height:30px}
.pk-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.pk-button:disabled{opacity:.45;cursor:default}
.pk-button[data-primary=true]{background:var(--dsw-alias-button-info-fill);color:var(--dsw-alias-label-primary-bluish);border-color:transparent}
.pk-input{box-sizing:border-box;width:100%;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit}
.pk-input:disabled{opacity:.5}
.pk-input.pk-result{border:0;background:transparent;padding:2px}
.pk-textarea{resize:vertical;min-height:120px;line-height:1.65}
.pk-label{display:flex;flex-direction:column;gap:5px}
.pk-label>span{color:var(--dsw-alias-label-secondary);font-size:12px}
.pk-caption{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0}
.pk-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:34px}
.pk-switch input{accent-color:var(--dsw-alias-state-business-primary)}
.pk-box{padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px}
.pk-box p{margin:6px 0}
.pk-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pk-stack{display:flex;flex-direction:column;gap:12px}
.pk-divider{border:0;border-top:1px solid var(--dsw-alias-border-l2);margin:10px 0}
.pk-error{color:var(--dsw-alias-state-error-primary);padding:8px 0;white-space:pre-wrap}
.pk-notice{padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;color:var(--dsw-alias-label-secondary)}
.pk-panel summary{cursor:pointer}
.pk-management{border:0;border-radius:0;background:transparent;overflow:visible}
.pk-tabs{display:flex;gap:4px;overflow:auto;padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l2);flex:none}
.pk-tab{font:inherit;border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:6px 10px;border-radius:7px;cursor:pointer;white-space:nowrap}
.pk-tab[aria-selected=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover-solid,var(--dsw-alias-interactive-bg-hover))}
.pk-content{padding:16px 0}
.pk-management .pk-body{padding:0;overflow:visible}
.pk-management .pk-foot{padding:12px 0 0;border:0}
.pk-management .pk-error-bar{padding:8px 0}
.pk-management .pk-toast{position:sticky;bottom:8px;width:max-content;margin:8px auto 0}
.pk-import{position:relative;display:inline-flex;align-items:center}
.pk-import .pk-file{position:absolute;inset:0;opacity:0;width:100%;cursor:pointer}
.pk-import:focus-within{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
@media(hover:none){.pk-row-actions{display:flex}.pk-grip{opacity:1}}
@media(max-width:600px){.pk-body{padding:10px 12px}.pk-head{padding:8px 8px 6px 12px}.pk-foot{padding:8px}}
`;
