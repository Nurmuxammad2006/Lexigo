        // Sample data with enhanced features
        const contacts=[
            {id:1,name:"Student 1",type:"direct",online:true,messages:[
                {id:101,from:"them",text:"Hey, did you get the assignment?",time:"09:30"},
                {id:102,from:"me",text:"Yeah, working on it now.",time:"09:31"},
                {id:103,from:"them",text:"Cool, let me know if you need help!",time:"09:33"}
            ]},
            {id:2,name:"Student 2",type:"direct",online:false,messages:[
                {id:201,from:"them",text:"Are we still studying together tonight?",time:"14:10"},
                {id:202,from:"me",text:"Yes! Library at 7?",time:"14:12"},
                {id:203,from:"them",text:"Perfect, see you there 👍",time:"14:13"}
            ]},
            {id:3,name:"Instructor",type:"direct",online:true,messages:[
                {id:301,from:"them",text:"Hello, are you ready for the IELTS session?",time:"09:41"},
                {id:302,from:"me",text:"Yes, I'm ready 👍",time:"09:42"},
                {id:303,from:"them",text:"Great, we'll start in 5 minutes.",time:"09:43"}
            ]}
        ];

        // Global user database (simulated)
        const globalUsers=[
            {id:101,name:"Alice Johnson",country:"USA",online:true,isFriend:false},
            {id:102,name:"Mohammed Ali",country:"Egypt",online:false,isFriend:false},
            {id:103,name:"Sofia Garcia",country:"Spain",online:true,isFriend:false},
            {id:104,name:"Yuki Tanaka",country:"Japan",online:true,isFriend:false},
            {id:105,name:"Emma Brown",country:"UK",online:false,isFriend:false}
        ];

        let activeContactId=null,nextMsgId=500,nextContactId=1000;

        // Emoji categories
        const emojis={
            smileys:["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷"],
            gestures:["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏"],
            hearts:["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟"],
            objects:["⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🏒","🏑","🥍","🏏","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋"]
        };

        function now(){const d=new Date();return d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0")}
        function getContact(id){return contacts.find(c=>c.id===id)}
        function lastPreview(c){
            const m=c.messages;
            if(!m.length)return"No messages yet";
            const l=m[m.length-1];
            if(l.type==="file")return l.from==="me"?"You sent a file":"Sent a file";
            return(l.from==="me"?"You: ":"")+l.text;
        }

        function renderContacts(filter=""){
            const list=document.getElementById("contactList"),lower=filter.toLowerCase(),
            filtered=contacts.filter(c=>c.name.toLowerCase().includes(lower));
            if(!filtered.length){list.innerHTML='<div class="no-results">No conversations found</div>';return}
            list.innerHTML=filtered.map(c=>{
                const isGroup=c.type==="group";
                const statusHtml=c.online?'<div class="status-indicator online"></div>':'<div class="status-indicator"></div>';
                const iconClass=isGroup?'avatar-wrap group-icon':'avatar-wrap';
                const icon=isGroup?'fa-users':'fa-user';
                return `<div class="chat-user ${c.id===activeContactId?"active":""}" data-contact-id="${c.id}">
                    <div class="${iconClass}">
                        <i class="fa-solid ${icon}"></i>
                        ${!isGroup?statusHtml:''}
                    </div>
                    <div class="info">
                        <strong>${c.name}</strong>
                        <p>${lastPreview(c)}</p>
                    </div>
                </div>`;
            }).join("");
        }

        function renderMessages(){
            const container=document.getElementById("chatMessages"),contact=getContact(activeContactId);
            if(!contact){container.innerHTML="";return}
            container.innerHTML=contact.messages.map(msg=>{
                if(msg.type==="file"){
                    const fileIcon=getFileIcon(msg.fileName);
                    return `<div class="message ${msg.from==="me"?"sent":"received"}" data-message-id="${msg.id}">
                        ${msg.from==="me"?`<div class="message-actions"><i class="fa-solid fa-trash delete-message"></i></div>`:""}
                        <div class="message-file" onclick="downloadFile('${msg.fileName}','${msg.fileData}')">
                            <div class="file-icon">${fileIcon}</div>
                            <div class="file-info">
                                <div class="file-name">${msg.fileName}</div>
                                <div class="file-size">${msg.fileSize}</div>
                            </div>
                            <i class="fa-solid fa-download" style="color:${msg.from==="me"?"#fff":"#9ca3b0"}"></i>
                        </div>
                        <span class="message-time">${msg.time}</span>
                    </div>`;
                }
                return `<div class="message ${msg.from==="me"?"sent":"received"}" data-message-id="${msg.id}">
                    ${msg.from==="me"?`<div class="message-actions">
                        <i class="fa-solid fa-pen edit-message"></i>
                        <i class="fa-solid fa-trash delete-message"></i>
                    </div>`:""}
                    <p class="message-text">${msg.text}</p>
                    <span class="message-time">${msg.time}</span>
                </div>`;
            }).join("");
            container.scrollTop=container.scrollHeight;
        }

        function getFileIcon(fileName){
            const ext=fileName.split('.').pop().toLowerCase();
            const icons={
                pdf:'📄',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',
                doc:'📝',docx:'📝',txt:'📝',zip:'📦',rar:'📦',
                mp3:'🎵',mp4:'🎬',avi:'🎬',default:'📎'
            };
            return icons[ext]||icons.default;
        }

        function formatFileSize(bytes){
            if(bytes<1024)return bytes+' B';
            if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';
            return(bytes/1048576).toFixed(1)+' MB';
        }

        function switchContact(id){
            activeContactId=id;
            const contact=getContact(id);
            if(!contact)return;
            document.getElementById("headerName").textContent=contact.name;
            
            // Update online status
            const statusEl=document.getElementById("onlineStatus");
            if(contact.type==="group"){
                statusEl.textContent=`${contact.members?contact.members.length:0} members`;
                statusEl.style.color="#9ca3b0";
            }else{
                statusEl.textContent=contact.online?"Online":"Offline";
                statusEl.style.color=contact.online?"#10b981":"#9ca3b0";
            }
            
            document.getElementById("chatHeader").dataset.chatId=contact.id;
            renderContacts();
            renderMessages();
        }

        // Contact list click handler
        document.getElementById("contactList").addEventListener("click",e=>{
            const item=e.target.closest(".chat-user");
            if(!item)return;
            const id=Number(item.dataset.contactId);
            if(id&&id!==activeContactId)switchContact(id);
        });

        // Search handler
        document.getElementById("chatSearch").addEventListener("input",e=>renderContacts(e.target.value));

        // Send message
        function sendMessage(){
            const input=document.getElementById("chatInput"),text=input.value.trim();
            if(!text||!activeContactId)return;
            const contact=getContact(activeContactId);
            if(!contact)return;
            contact.messages.push({id:nextMsgId++,from:"me",text,time:now()});
            input.value="";
            renderMessages();
            renderContacts();
        }

        document.getElementById("sendBtn").addEventListener("click",sendMessage);
        document.getElementById("chatInput").addEventListener("keydown",e=>{
            if(e.key==="Enter"){e.preventDefault();sendMessage();}
        });

        // File upload handler
        document.getElementById("fileInput").addEventListener("change",e=>{
            const file=e.target.files[0];
            if(!file||!activeContactId)return;
            const contact=getContact(activeContactId);
            if(!contact)return;
            
            const reader=new FileReader();
            reader.onload=function(ev){
                contact.messages.push({
                    id:nextMsgId++,
                    from:"me",
                    type:"file",
                    fileName:file.name,
                    fileSize:formatFileSize(file.size),
                    fileData:ev.target.result,
                    time:now()
                });
                renderMessages();
                renderContacts();
            };
            reader.readAsDataURL(file);
            e.target.value="";
        });

        function downloadFile(fileName,fileData){
            const link=document.createElement('a');
            link.href=fileData;
            link.download=fileName;
            link.click();
        }

        // Emoji picker
        const emojiBtn=document.getElementById("emojiBtn"),
              emojiPicker=document.getElementById("emojiPicker"),
              emojiGrid=document.getElementById("emojiGrid");

        let allEmojis=[];
        Object.values(emojis).forEach(cat=>allEmojis.push(...cat));
        emojiGrid.innerHTML=allEmojis.map(e=>`<div class="emoji-item">${e}</div>`).join("");

        emojiBtn.addEventListener("click",e=>{
            e.stopPropagation();
            emojiPicker.classList.toggle("active");
        });

        emojiGrid.addEventListener("click",e=>{
            if(e.target.classList.contains("emoji-item")){
                const input=document.getElementById("chatInput");
                input.value+=e.target.textContent;
                input.focus();
                emojiPicker.classList.remove("active");
            }
        });

        document.addEventListener("click",e=>{
            if(!emojiPicker.contains(e.target)&&!emojiBtn.contains(e.target)){
                emojiPicker.classList.remove("active");
            }
        });

        // Message actions (edit/delete)
        document.getElementById("chatMessages").addEventListener("click",e=>{
            if(e.target.classList.contains("delete-message")){
                const messageEl=e.target.closest(".message");
                if(!messageEl)return;
                const msgId=Number(messageEl.dataset.messageId);
                if(!confirm("Delete this message?"))return;
                const contact=getContact(activeContactId);
                if(contact)contact.messages=contact.messages.filter(m=>m.id!==msgId);
                messageEl.remove();
                renderContacts();
                return;
            }
            if(e.target.classList.contains("edit-message")){
                const messageEl=e.target.closest(".message");
                if(!messageEl)return;
                const textEl=messageEl.querySelector(".message-text"),
                      msgId=Number(messageEl.dataset.messageId);
                if(!textEl)return;
                const newText=prompt("Edit message:",textEl.textContent);
                if(!newText||newText.trim()==="")return;
                const contact=getContact(activeContactId);
                if(contact){
                    const msg=contact.messages.find(m=>m.id===msgId);
                    if(msg)msg.text=newText.trim();
                }
                textEl.textContent=newText.trim();
                renderContacts();
            }
        });

        // Chat menu handlers
        const moreBtn=document.getElementById("moreBtn"),chatMenu=document.getElementById("chatMenu");
        function closeMenu(){chatMenu.classList.remove("active")}
        moreBtn.addEventListener("click",e=>{e.stopPropagation();chatMenu.classList.toggle("active")});
        document.addEventListener("click",e=>{
            if(!chatMenu.contains(e.target)&&!moreBtn.contains(e.target))closeMenu();
        });

        document.querySelector(".alert-chat").addEventListener("click",()=>{
            alert("Alert: conversation with "+(getContact(activeContactId)?.name||"unknown")+" flagged.");
            closeMenu();
        });

        document.querySelector(".edit-chat").addEventListener("click",()=>{
            const contact=getContact(activeContactId);
            if(!contact){closeMenu();return}
            const newName=prompt("Rename conversation:",contact.name);
            if(!newName||newName.trim()===""){closeMenu();return}
            contact.name=newName.trim();
            document.getElementById("headerName").textContent=contact.name;
            renderContacts();
            closeMenu();
        });

        document.querySelector(".delete-chat").addEventListener("click",()=>{
            const contact=getContact(activeContactId);
            if(!contact){closeMenu();return}
            if(!confirm("Delete conversation with "+contact.name+"?")){closeMenu();return}
            const idx=contacts.findIndex(c=>c.id===activeContactId);
            if(idx!==-1)contacts.splice(idx,1);
            activeContactId=null;
            document.getElementById("headerName").textContent="—";
            document.getElementById("onlineStatus").textContent="";
            document.getElementById("chatHeader").dataset.chatId="";
            document.getElementById("chatMessages").innerHTML="";
            renderContacts();
            closeMenu();
        });

        // Modal handlers
        function openModal(modalId){
            document.getElementById(modalId).classList.add("active");
        }

        function closeModal(modalId){
            document.getElementById(modalId).classList.remove("active");
        }

        // Search Users Worldwide
        document.getElementById("searchUsersBtn").addEventListener("click",()=>openModal("searchModal"));
        document.getElementById("closeSearchModal").addEventListener("click",()=>closeModal("searchModal"));

        document.getElementById("globalSearch").addEventListener("input",e=>{
            const query=e.target.value.toLowerCase(),
                  results=document.getElementById("searchResults");
            if(!query){results.innerHTML="";return}
            const filtered=globalUsers.filter(u=>
                u.name.toLowerCase().includes(query)||u.country.toLowerCase().includes(query)
            );
            results.innerHTML=filtered.map(u=>`
                <div class="user-result" data-user-id="${u.id}">
                    <div class="user-result-info">
                        <div class="avatar-wrap">
                            <i class="fa-solid fa-user"></i>
                            ${u.online?'<div class="status-indicator online"></div>':'<div class="status-indicator"></div>'}
                        </div>
                        <div>
                            <strong style="font-size:.88rem;color:#1a1f2e">${u.name}</strong>
                            <p style="font-size:.75rem;color:#9ca3b0;margin-top:2px">${u.country}</p>
                        </div>
                    </div>
                    <button onclick="addFriend(${u.id})" id="addBtn${u.id}">
                        ${u.isFriend?'Added':'Add Friend'}
                    </button>
                </div>
            `).join("");
        });

        function addFriend(userId){
            const user=globalUsers.find(u=>u.id===userId);
            if(!user||user.isFriend)return;
            user.isFriend=true;
            
            // Add to contacts
            contacts.push({
                id:nextContactId++,
                name:user.name,
                type:"direct",
                online:user.online,
                messages:[]
            });
            
            renderContacts();
            document.getElementById("addBtn"+userId).textContent="Added";
            document.getElementById("addBtn"+userId).classList.add("added");
        }

        // Create Group Chat
        document.getElementById("createGroupBtn").addEventListener("click",()=>{
            document.getElementById("selectedUsers").innerHTML="";
            selectedForGroup=[];
            // Refresh available users list
            const availableUsers=document.getElementById("availableUsers");
            availableUsers.innerHTML=contacts.filter(c=>c.type==="direct").map(c=>`
                <div class="user-result" data-contact-id="${c.id}">
                    <div class="user-result-info">
                        <div class="avatar-wrap">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div>
                            <strong style="font-size:.88rem;color:#1a1f2e">${c.name}</strong>
                        </div>
                    </div>
                    <button onclick="toggleUserForGroup(${c.id},'${c.name}')" id="selectBtn${c.id}">Select</button>
                </div>
            `).join("");
            openModal("groupModal");
        });
        document.getElementById("closeGroupModal").addEventListener("click",()=>closeModal("groupModal"));

        let selectedForGroup=[];

        function toggleUserForGroup(contactId,contactName){
            const idx=selectedForGroup.findIndex(u=>u.id===contactId);
            const btn=document.getElementById("selectBtn"+contactId);
            
            if(idx===-1){
                selectedForGroup.push({id:contactId,name:contactName});
                btn.textContent="Selected";
                btn.classList.add("added");
            }else{
                selectedForGroup.splice(idx,1);
                btn.textContent="Select";
                btn.classList.remove("added");
            }
            
            // Update selected tags
            const tagsContainer=document.getElementById("selectedUsers");
            tagsContainer.innerHTML=selectedForGroup.map(u=>`
                <div class="selected-user-tag">
                    ${u.name}
                    <i class="fa-solid fa-xmark" onclick="toggleUserForGroup(${u.id},'${u.name}')"></i>
                </div>
            `).join("");
        }

        document.getElementById("createGroupForm").addEventListener("submit",e=>{
            e.preventDefault();
            const groupName=document.getElementById("groupName").value.trim();
            if(!groupName||selectedForGroup.length<2){
                alert("Please enter a group name and select at least 2 members");
                return;
            }
            
            contacts.push({
                id:nextContactId++,
                name:groupName,
                type:"group",
                members:selectedForGroup,
                messages:[]
            });
            
            renderContacts();
            closeModal("groupModal");
            document.getElementById("groupName").value="";
            selectedForGroup=[];
        });

        // Initialize
        (function init(){
            if(contacts.length)switchContact(contacts[2].id);
            else renderContacts();
        })();