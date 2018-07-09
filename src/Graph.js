import React, {
    Component
} from 'react';
import './css/Graph.css';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import _ from 'lodash';
import { Button, Grid, Row, Col, Modal , Table, Glyphicon } from 'react-bootstrap';


class Graph extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            linkedRouter: '',
            linkedRouterFrom: '',
            delay: '',
            weight: '',
            from: '',
            verso: '',
            weightPacket: '',
            show: false
        }
        this.packets = [];
        this.finalPacket = [];
        this.data = {
            "nodes": [],
            "links": []
        }

        this.createGraph = () => new window.Diagram('#diagram', _.cloneDeep(this.data), {positionCache: true}).init('bandwidth');

        this.update = () => {
            this.setState({
                linkedRouterFrom: '',
                linkedRouter: '',
                delay: '',
                weight: ''
            });
            this.data.links.push({
                "source": this.state.linkedRouterFrom,
                "target": this.state.linkedRouter,
                meta: {
                    bandwidth: "C:" + this.state.weight + ";  τ:" + this.state.delay
                },
                delay: Number(this.state.delay) / 1000,
                weight: Number(this.state.weight)
            })

            const list = document.getElementById("diagram"); // Get the <ul> element with id="myList"
            list.removeChild(list.childNodes[0]);
            this.createGraph();
        }

        this.aggiungiPacchetti = () => {
            this.packets.push({
                from: this.state.from,
                to: this.state.verso,
                weightPacket: Number(this.state.weightPacket),
                id: this.packets.length
            });
            this.setState({
                from: '',
                verso: '',
                weightPacket: ''
            });
        }

        this.visualizzaPacchetti = () => {
            this.setState({
                showModalPackets: true
            });
        };

        this.visualizzaNodi = () => {
            this.setState({
                showModalNodes: true
            });
        };

        this.visualizzaLinks = () => {
            this.setState({
                showModalLinks: true
            });
        };


        this.deletePacket = (obj, idx) => {
            _.remove(this.packets, (packet, index) => {
                return index === idx;
            })
            _.forEach(this.packets, (p,index) => {
                p.id = index;
            })
            this.forceUpdate();
        };

        this.deleteNode = (obj, idx) => {
            _.remove(this.data.nodes, (node, index) => {
                return index === idx;
            });
            _.remove(this.options, opt => {
                return (opt.value === obj.name && opt.label === obj.name);
            })
            const list = document.getElementById("diagram"); // Get the <ul> element with id="myList"
            list.removeChild(list.childNodes[0]);
            this.createGraph();
            this.forceUpdate();
        };

        this.deleteLink = (obj, idx) => {
            _.remove(this.data.links, (link, index) => {
                return index === idx;
            });
            const list = document.getElementById("diagram"); // Get the <ul> element with id="myList"
            list.removeChild(list.childNodes[0]);
            this.createGraph();
            this.forceUpdate();
        };

        const returnNode = (name, dataWork) => {
            let currentlyNode = undefined
            dataWork.nodes.forEach((node) => {
                if (node.name ===  name) currentlyNode = node;
            });
            return Object.assign({}, currentlyNode);
        }
        

        this.calcola = (p, nameFather, dataWork) => {
            const currentlyNode = returnNode(p, dataWork);
            if (currentlyNode.packets.length === 0) {
                const childNodeObject = returnChild(currentlyNode.name)
                const childNodeArray = [];
                _.forEach(childNodeObject, (child, key) => {
                    if (key !== nameFather) childNodeArray.push(returnNode(key, dataWork));
                });
                childNodeArray.forEach(child => {
                    this.calcola(child.name, currentlyNode.name, dataWork).forEach(packet => {
                        currentlyNode.packets.push(packet);
                    });
                })
                currentlyNode.packets = _.orderBy(currentlyNode.packets, ['timeSent']);
                if (nameFather === undefined) return _.filter(currentlyNode.packets, packet => {
                    return packet.to === currentlyNode.name;
                });
                let lastExecution = 0;
                currentlyNode.packets.forEach((packet, index) => {
                    let percorsoAttuale = undefined;

                    let isForFather = false
                    for(let i = 0; i< packet.percorso.length; i++) {
                        if (packet.percorso[i] === currentlyNode.name && packet.percorso[i + 1] === nameFather) {
                            isForFather = true;
                        }
                    }


                    _.forEach(dataWork.links, link => {
                        if (link.target === nameFather && link.source === currentlyNode.name) {
                            percorsoAttuale = link;
                        } else if (link.source === nameFather && link.target === currentlyNode.name) {
                            percorsoAttuale = link;
                        }
                    })

                    if (!isForFather) {

                        return;
                    }

                    //Calcolo costo di elaborazione nel nodo
                    if (lastExecution > packet.timeSent) {
                        currentlyNode.packets.forEach((packet2, index2) => {
                            if (packet2.id === packet.id - 1) {
                                packet.stringExplanation = _.cloneDeep(packet2.stringExplanation);
                                packet.stringExplanation.pop();
                            }
                        })
                        packet.stringExplanation.push(packet.weightPacket.toString() + "/" + percorsoAttuale.weight.toString());
                        packet.stringExplanation.push(percorsoAttuale.delay.toString());

                        packet.time = lastExecution + packet.weightPacket / percorsoAttuale.weight;
                        lastExecution = packet.time;
                        packet.timeSent = packet.time + percorsoAttuale.delay;
                    } else {
                        packet.stringExplanation.push(packet.weightPacket.toString() + "/" + percorsoAttuale.weight.toString());
                        packet.stringExplanation.push(percorsoAttuale.delay.toString());

                        //Calcolo costo di elaborazione nel nodo
                        packet.time = packet.timeSent + packet.weightPacket / percorsoAttuale.weight;
                        lastExecution = packet.time;
                        //calcolo costo di propagazione verso il nodo successivo;
                        packet.timeSent = packet.time + percorsoAttuale.delay;
                    }
                });
                return currentlyNode.packets;
            } else {
                let lastExecution = 0;
                currentlyNode.packets.forEach((packet, index) => {
                    packet.stringExplanation = [];
                    let percorsoAttuale = undefined;
                    _.forEach(dataWork.links, link => {
                        if (link.target === nameFather && link.source === currentlyNode.name) {
                            percorsoAttuale = link;
                        } else if (link.source === nameFather && link.target === currentlyNode.name) {
                            percorsoAttuale = link;
                        }
                    })

                    currentlyNode.packets.forEach((packet2, index2) => {
                        if (index2 < index) {
                            packet.stringExplanation.push(packet2.weightPacket.toString() + "/" + percorsoAttuale.weight.toString())
                        } else if (index2 === index) {
                            packet.stringExplanation.push(packet.weightPacket.toString() + "/" + percorsoAttuale.weight.toString())
                        }
                    });
                    packet.stringExplanation.push(percorsoAttuale.delay.toString());
                    // Calcolo costo di elaborazione nel nodo
                    packet.time = lastExecution + packet.weightPacket / percorsoAttuale.weight;
                    lastExecution = packet.time;
                    //calcolo costo di propagazione verso il nodo successivo;
                    packet.timeSent = packet.time + percorsoAttuale.delay;
                });
                return currentlyNode.packets;
            }

        };

        const returnChild = node => {
            const child = {}
            _.forEach(this.data.links, link =>  {
                if (link.target === node) {
                    child[link.source] = 1;
                } else if (link.source === node) {
                    child[link.target] = 1;
                }
            });
            return child;
        }
        const retrievePercorso = (from, to) => {
            //Tirare fuori creazione mappa
            const map = {}
            _.forEach(this.data.nodes, node => {
                map[node.name] = returnChild(node.name)
            });
            const graph = new window.Dijkstra(map);

            return graph.findShortestPath(from, to);
        }

        this.organizzaPacchetti = () => {
            this.destinationPacket = [];
            const dataWork = _.cloneDeep(this.data);
            this.packets.forEach((p, index) => {
                p.percorso = retrievePercorso(p.from, p.to);
                dataWork.nodes.forEach((node) => {
                    if (node.name ===  p.from) {
                        node.packets.push(p);
                    }
                });
                let boolean = false
                this.destinationPacket.forEach(d => {
                    if (d === p.to) boolean = true;
                });
                if (boolean ===  false) this.destinationPacket.push(p.to);
            });
            this.finalPacket = [];
            this.destinationPacket.forEach(d => {
                this.finalPacket = this.finalPacket.concat(this.calcola(d, undefined, _.cloneDeep(dataWork)));
            });
            this.finalPacket = _.orderBy(this.finalPacket, ['id']);
            this.setState({
                show: true
            });
            this.forceUpdate();
        }


        this.handleChange = this.handleChange.bind(this);
        this.handleChangeSelect = this.handleChangeSelect.bind(this);
        this.handleChangeSelectFrom = this.handleChangeSelectFrom.bind(this);
        this.addNode = this.addNode.bind(this);
        this.handleChangeFrom = this.handleChangeFrom.bind(this);
        this.handleChangeVerso = this.handleChangeVerso.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.handleHidePackets = this.handleHidePackets.bind(this);
        this.handleHideNodes = this.handleHideNodes.bind(this);
        this.handleHideLinks = this.handleHideLinks.bind(this);


        this.options = [];
    }

    addNode() {
        const name = this.state.name;
        this.data.nodes.push({
            name,
            "packets": []
        })
        const list = document.getElementById("diagram"); // Get the <ul> element with id="myList"
        list.removeChild(list.childNodes[0]);
        this.createGraph();
        this.options.push({
            value: name,
            label: name
        })
        this.setState({
            name: '',
            linkedRouter: '',
        });

    }


    handleChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value.toUpperCase()
        });
    }

    handleChangeSelect(event) {
        this.setState({
            linkedRouter: event.value
        });
    }

    handleChangeSelectFrom(event) {
        this.setState({
            linkedRouterFrom: event.value
        });
    }

    handleChangeFrom(event) {
        this.setState({
            from: event.value
        });
    }

    handleChangeVerso(event) {
        this.setState({
            verso: event.value
        });
    }

    componentDidMount() {
        this.createGraph();
    }

    handleHide() {
        this.setState({
            show: false
        });
    }

    handleHidePackets() {
        this.setState({
            showModalPackets: false
        });
    }

    handleHideNodes() {
        this.setState({
            showModalNodes: false
        });
    }

    handleHideLinks() {
        this.setState({
            showModalLinks: false
        });
    }


    render() {
        let listItems = null;
        if (this.finalPacket.length > 0) {
            listItems = this.finalPacket.map((item, index) => {
                let finalString = "";
                item.stringExplanation.forEach((s, index) => {
                   finalString = finalString + s;
                   if (index < item.stringExplanation.length - 1) finalString = finalString + " + ";
                });
                return (
                <tr key={index}>
                    <td>{item.id}</td>
                    <td>{item.from}</td>
                  <td>{item.to}</td>    
                  <td>{item.timeSent.toFixed(5)}</td>
                  <td>{finalString}</td>
                </tr>);
              });
        } else {
            listItems = <tr key={1}>
            <td>
                Nessun pacchetto inserito
            </td>
        </tr>;;
        }

        let listPackets = null;

        if (this.packets.length > 0) {
            listPackets = this.packets.map((item, index) => {
                return (
                <tr key={index}>
                    <td>{item.id}</td>
                    <td>{item.from}</td>
                  <td>{item.to}</td>
                  <td>{item.weightPacket}</td>
                  <td onClick={ () => this.deletePacket(item, index)}><Glyphicon glyph="trash" /></td>

                </tr>);
              });
        } else {
            listPackets =  <tr key={1}>
                <td>
                    Nessun pacchetto inserito
                </td>
            </tr>;
        }

        let listNodes = null;

        if (this.data.nodes.length > 0) {
            listNodes = this.data.nodes.map((item, index) => {
                return (
                    <tr key={index}>
                            <td>{item.name}</td>
                        <td onClick={ () => this.deleteNode(item, index)}><Glyphicon glyph="trash" /></td>

                    </tr>);
            });
        } else {
            listNodes =  <tr key={1}>
                <td>
                    Nessun pacchetto inserito
                </td>
            </tr>;
        }

        let listLinks = null;

        if (this.data.links.length > 0) {
            listLinks = this.data.links.map((item, index) => {
                return (
                    <tr key={index}>
                        <td>{item.source}</td>
                        <td>{item.target}</td>
                        <td>{item.weight}</td>
                        <td>{item.delay * 1000}</td>
                        <td onClick={ () => this.deleteLink(item, index)}><Glyphicon glyph="trash" /></td>
                    </tr>);
            });
        } else {
            listLinks =  <tr key={1}>
                <td>
                    Nessun link inserito
                </td>
            </tr>;
        }
      

        let options = this.options;
        return (<div>
            <div className="diagramClass" id="diagram"></div>
            <Grid>
                <Row>
                    <Col sm={4}> Nome router:</Col>
                    <Col sm={8}>
                    <input type="text" name="name" value={ this.state.name } onChange={ this.handleChange } />
                    </Col>
                </Row>
            </Grid>
            <Button onClick={ this.addNode }> Aggiungi nodo</Button>
            <Button onClick={ this.visualizzaNodi }> Visualizza lista nodi</Button>
            <Grid>
                <Row>
                    <Col sm={4}> Capacità link ( in Bit al secondo):
                    </Col>
                    <Col sm={8}>
                    <input type="number" name="weight" value={ this.state.weight } onChange={ this.handleChange } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Ritardo di propagazione (in ms):
                    </Col>
                    <Col sm={8}>
                    <input type="number" name="delay" value={ this.state.delay } onChange={ this.handleChange } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Collegato da:
                    </Col>
                    <Col sm={8}>
                        <Select name="linked-router" value={ this.state.linkedRouterFrom } onChange={ this.handleChangeSelectFrom } options={ options } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Collegato a:
                    </Col>
                    <Col sm={8}>
                    <Select name="linked-router" value={ this.state.linkedRouter } onChange={ this.handleChangeSelect } options={ options } />
                    </Col>
                </Row>
            </Grid>
            <Button onClick={ this.update }> Aggiungi Link</Button>
            <Button onClick={ this.visualizzaLinks }> Visualizza Links</Button>

            <Grid>
                <Row>
                    <Col sm={4}> Pacchetto da:
                    </Col>
                    <Col sm={8}>
                    <Select name="from" value={ this.state.from } onChange={ this.handleChangeFrom } options={ options } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Destinazione:
        
                    </Col>
                    <Col sm={8}>
                    <Select name="verso" value={ this.state.verso } onChange={ this.handleChangeVerso } options={ options } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Peso pacchetto in bit:
        
                    </Col>
                    <Col sm={8}>
                    <input type="number" name="weightPacket" value={ this.state.weightPacket } onChange={ this.handleChange } />
                    </Col>
                </Row>
                <Row>
                <Button onClick={ this.aggiungiPacchetti }> Aggiungi Pacchetto</Button>
                <Button onClick={ this.visualizzaPacchetti }> Visualizza Pacchetti inseriti</Button>

                </Row>
            </Grid>
            <Button onClick={ this.organizzaPacchetti }> Calcola</Button>
            
            <Modal
          show={this.state.show}
          onHide={this.handleHide}
          container={this}
          aria-labelledby="contained-modal-title">
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title">
                Dati Pacchetti
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Table responsive>
              <thead>
    <tr>
        <th>ID pacchetto</th>
        <th>Nodo sorgente</th>
      <th>Nodo destinazione</th>
      <th>Tempo totale</th>
        <th>Calcoli</th>
    </tr>
  </thead>
  <tbody>
      {listItems}
  </tbody>

              </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleHide}>Chiudi</Button>
          </Modal.Footer>
        </Modal>
          
        <Modal
          show={this.state.showModalPackets}
          onHide={this.handleHidePackets}
          container={this}
          aria-labelledby="contained-modal-title">
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title">
                Pacchetti inseriti
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Table responsive>
              <thead>
    <tr>
        <th>ID pacchetto</th>
        <th>Nodo sorgente</th>
        <th>Nodo destinazione</th>
        <th>Peso Pacchetto</th>
        <th>Elimina pacchetto</th>

    </tr>
  </thead>
  <tbody>
      {listPackets}
  </tbody>

              </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleHidePackets}>Chiudi</Button>
          </Modal.Footer>
        </Modal>

            <Modal
                show={this.state.showModalNodes}
                onHide={this.handleHideNodes}
                container={this}
                aria-labelledby="contained-modal-title">
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title">
                       Lista nodi
                     </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Nome nodo</th>
                            <th>Elimina nodo</th>

                        </tr>
                        </thead>
                        <tbody>
                        {listNodes}
                        </tbody>

                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleHideNodes}>Chiudi</Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={this.state.showModalLinks}
                onHide={this.handleHideLinks}
                container={this}
                aria-labelledby="contained-modal-title">
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title">
                        Lista Link
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Link collegato da</th>
                            <th>Link collegato a</th>
                            <th>Capacità</th>
                            <th>Ritardo di propagazione</th>
                            <th>Elimina</th>
                        </tr>
                        </thead>
                        <tbody>
                        {listLinks}
                        </tbody>

                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleHideLinks}>Chiudi</Button>
                </Modal.Footer>
            </Modal>
        </div>);
    }
}

export default Graph;